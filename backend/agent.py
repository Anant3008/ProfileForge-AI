"""
AI-Powered SQL Agent - The Heart of ProfileForge AI Backend

This agent uses LangChain + Google Gemini to:
1. Parse natural language queries/commands about student data
2. Generate safe, student-scoped SQL queries
3. Execute queries on the database
4. Return human-readable responses

CRITICAL SECURITY: All queries are automatically scoped to the authenticated student_id
"""
import os
import re
import json
from datetime import datetime
from typing import Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
from langchain_community.utilities.sql_database import SQLDatabase
from langchain_google_genai import ChatGoogleGenerativeAI
from database import engine


# Lightweight JSONL activity logging (file-based, no database)
LOG_DIR = os.getenv("AI_LOG_DIR", "logs")
LOG_PATH = os.path.join(LOG_DIR, "ai_activity.jsonl")
os.makedirs(LOG_DIR, exist_ok=True)


def log_ai_event(student_id: int, kind: str, payload: Dict[str, Any]) -> None:
    event = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "student_id": student_id,
        "kind": kind,
        **payload,
    }
    try:
        with open(LOG_PATH, "a", encoding="utf-8") as f:
            json.dump(event, f)
            f.write("\n")
    except Exception:
        # Intentionally swallow logging errors to avoid breaking main flow
        pass


class SafetyConfig:
    """Security constraints for SQL generation"""
    
    # Allowed SQL operations
    ALLOWED_OPERATIONS = ["SELECT", "UPDATE", "INSERT"]
    
    # Tables that can be queried/modified
    ALLOWED_TABLES = ["students", "education_details", "courses", "applications"]
    
    # Forbidden keywords that could be destructive
    FORBIDDEN_KEYWORDS = [
        "DROP", "DELETE", "TRUNCATE", "ALTER", 
        "CREATE", "GRANT", "REVOKE"
    ]
    
    @staticmethod
    def validate_sql(sql: str) -> tuple[bool, str]:
        """
        Validate generated SQL for safety
        Returns: (is_safe, error_message)
        """
        sql_upper = sql.upper()
        
        # Check for forbidden keywords
        for keyword in SafetyConfig.FORBIDDEN_KEYWORDS:
            if keyword in sql_upper:
                return False, f"Forbidden operation detected: {keyword}"
        
        # Ensure student_id is in WHERE clause for SELECT/UPDATE
        if "SELECT" in sql_upper or "UPDATE" in sql_upper:
            if "WHERE" not in sql_upper or "student_id" not in sql.lower():
                return False, "Query must include student_id filter in WHERE clause"
        
        return True, ""


class StudentSQLAgent:
    """
    AI Agent that handles natural language interactions with the student database
    """
    
    def __init__(self, api_key: str):
        """Initialize the SQL agent with Gemini API"""
        self.api_key = api_key
        
        # Initialize Gemini LLM
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",  # Fast, reliable model that's widely available
            google_api_key=api_key,
            temperature=0,  # Deterministic for SQL generation
        )
        
        # Create SQLDatabase wrapper for LangChain
        self.db = SQLDatabase(engine)
        
        # Create toolkit
        self.toolkit = SQLDatabaseToolkit(db=self.db, llm=self.llm)
        
        # Get SQL tools from toolkit
        self.tools = self.toolkit.get_tools()
        
        # Store LLM and tools for agent execution
        self.llm = self.llm
    
    def _inject_student_context(self, query: str, student_id: int) -> str:
        """
        Inject student context into the query prompt
        This ensures the agent knows to filter by student_id
        """
        context = f"""
You are a helpful assistant that converts natural language to SQL queries.
CRITICAL SECURITY: You MUST always filter queries by student_id = {student_id}.

Available tables:
1. students - id, full_name, email, phone, date_of_birth, city, created_at
2. education_details - id, student_id, tenth_board, tenth_percentage, twelfth_board, twelfth_percentage
3. courses - id, title, duration_months, fee
4. applications - id, student_id, course_id, status, applied_at, reviewed_at

User query: {query}

Generate ONLY the SQL query (no explanation, no markdown). The query must:
1. Include "WHERE student_id = {student_id}" or "WHERE id = {student_id}" for student-related tables
2. Be a valid SQLite SELECT statement
3. Return useful columns for the user's question

Output ONLY the raw SQL, nothing else.
"""
        return context
    
    def _execute_sql(self, sql: str, db: Session) -> list:
        """Execute SQL and return results as list of dicts"""
        try:
            result = db.execute(text(sql))
            rows = result.fetchall()
            columns = result.keys()
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            raise Exception(f"SQL execution error: {str(e)}")
    
    def _format_results(self, query: str, results: list, student_id: int) -> str:
        """Use LLM to format raw results into a friendly response"""
        if not results:
            return "I couldn't find any data matching your request."
        
        prompt = f"""
Given this user question: "{query}"
And these database results: {results}

Write a friendly, conversational response that answers their question using the data.
Keep it concise and helpful. Don't mention SQL or databases.
"""
        message = self.llm.invoke(prompt)
        return message.content if hasattr(message, 'content') else str(message)

    def _looks_like_profile_question(self, user_query: str) -> bool:
        """
        Detect if user is asking a conversational question about their own profile data.
        This includes questions about education, personal info, or qualitative assessments.
        """
        query = user_query.lower().strip()
        
        # Question words indicating they want information about themselves
        question_patterns = ["what", "tell me", "show me", "how", "do i", "am i", "is my", "are my"]
        has_question_word = any(pattern in query for pattern in question_patterns)
        
        # Profile-related keywords
        profile_keywords = [
            "my", "profile", "education", "10th", "12th", "percentage", "marks", "score",
            "phone", "email", "city", "name", "details", "info", "information",
            "board", "cbse", "icse", "state", "good", "better", "strong", "weak",
            "course", "courses", "enrolled", "enrol", "applied", "application"
        ]
        has_profile_keyword = any(keyword in query for keyword in profile_keywords)
        
        # Short questions that are likely profile-related (5 words or less)
        is_short_question = len(query.split()) <= 5 and "?" in user_query
        
        return (has_question_word and has_profile_keyword) or is_short_question

    def _conversational_profile_response(self, user_query: str, student_id: int, db: Session) -> str:
        """
        Answer conversational questions about the user's profile by fetching their complete
        data and using the LLM to generate a natural, contextual response.
        """
        # Fetch complete student profile data
        student_sql = f"""
SELECT full_name, email, phone, date_of_birth, city, created_at
FROM students
WHERE id = {student_id}
LIMIT 1;
""".strip()
        
        education_sql = f"""
SELECT tenth_board, tenth_percentage, twelfth_board, twelfth_percentage
FROM education_details
WHERE student_id = {student_id}
LIMIT 1;
""".strip()
        
        courses_sql = f"""
SELECT c.title, c.duration_months, c.fee, a.status, a.applied_at, a.reviewed_at
FROM applications a
JOIN courses c ON a.course_id = c.id
WHERE a.student_id = {student_id}
ORDER BY a.applied_at DESC;
""".strip()

        try:
            student_data = self._execute_sql(student_sql, db)
            education_data = self._execute_sql(education_sql, db)
            courses_data = self._execute_sql(courses_sql, db)
            
            # Build context for LLM
            context = "User's Profile Information:\n"
            
            if student_data:
                student = student_data[0]
                context += f"- Name: {student.get('full_name', 'Not set')}\n"
                context += f"- Email: {student.get('email', 'Not set')}\n"
                context += f"- Phone: {student.get('phone', 'Not set')}\n"
                context += f"- Date of Birth: {student.get('date_of_birth', 'Not set')}\n"
                context += f"- City: {student.get('city', 'Not set')}\n"
            else:
                context += "- Basic profile information not found\n"
            
            context += "\nEducation Details:\n"
            if education_data:
                edu = education_data[0]
                context += f"- 10th Board: {edu.get('tenth_board', 'Not set')}\n"
                context += f"- 10th Percentage: {edu.get('tenth_percentage', 'Not set')}%\n"
                context += f"- 12th Board: {edu.get('twelfth_board', 'Not set')}\n"
                context += f"- 12th Percentage: {edu.get('twelfth_percentage', 'Not set')}%\n"
            else:
                context += "- Education details not yet added\n"
            
            context += "\nEnrolled Courses:\n"
            if courses_data:
                for course in courses_data:
                    title = course.get("title", "Unknown course")
                    duration = course.get("duration_months")
                    fee = course.get("fee")
                    status = course.get("status", "unknown")
                    enrolled_on = course.get("applied_at")
                    context += "- "
                    context += f"{title} | Status: {status}"
                    if duration is not None:
                        context += f" | Duration: {duration} months"
                    if fee is not None:
                        context += f" | Fee: ₹{fee}"
                    if enrolled_on is not None:
                        context += f" | Enrolled on: {enrolled_on}"
                    context += "\n"
            else:
                context += "- No courses enrolled yet\n"

            # Use LLM to generate conversational response
            prompt = f"""
You are a helpful academic profile assistant. The user has asked: "{user_query}"

{context}

Answer their question naturally and conversationally using the available data. Be friendly, supportive, and concise (2-3 sentences). If they ask about quality or assessment, provide honest, encouraging feedback based on the numbers. Don't mention technical terms like "database", "SQL", or "student_id".

Your response:
"""
            
            response = self.llm.invoke(prompt)
            return response.content if hasattr(response, 'content') else str(response)
            
        except Exception as e:
            return f"I had trouble fetching your profile data. Error: {str(e)}"



    def process_query(self, user_query: str, student_id: int, db: Session) -> Dict[str, Any]:
        """
        Process a natural language query from the student
        
        Args:
            user_query: Natural language input (e.g., "What courses have I applied to?")
            student_id: Authenticated student's ID
            db: Database session
            
        Returns:
            Dictionary with response and metadata
        """
        try:
            # Special handling for conversational profile questions
            if self._looks_like_profile_question(user_query):
                response_text = self._conversational_profile_response(user_query, student_id, db)
                log_ai_event(student_id, "conversational_profile", {
                    "query": user_query,
                    "response": response_text,
                })
                return {
                    "success": True,
                    "response": response_text,
                    "student_id": student_id,
                    "query": user_query
                }

            # Step 1: Generate SQL from natural language
            sql_prompt = self._inject_student_context(user_query, student_id)
            sql_response = self.llm.invoke(sql_prompt)
            generated_sql = sql_response.content.strip() if hasattr(sql_response, 'content') else str(sql_response).strip()
            
            # Clean up SQL (remove markdown code blocks if present)
            generated_sql = generated_sql.replace("```sql", "").replace("```", "").strip()
            
            # Step 2: Validate SQL safety
            is_safe, error_msg = SafetyConfig.validate_sql(generated_sql)
            if not is_safe:
                return {
                    "success": False,
                    "response": f"I can't execute that query for security reasons: {error_msg}",
                    "student_id": student_id,
                    "query": user_query
                }
            
            # Step 3: Execute the SQL
            results = self._execute_sql(generated_sql, db)
            
            # Step 4: Format results into natural language
            response_text = self._format_results(user_query, results, student_id)

            log_ai_event(student_id, "query", {
                "query": user_query,
                "generated_sql": generated_sql,
                "rows": len(results),
                "response": response_text,
            })
            
            return {
                "success": True,
                "response": response_text,
                "student_id": student_id,
                "query": user_query
            }
            
        except Exception as e:
            log_ai_event(student_id, "query_error", {
                "query": user_query,
                "error": str(e),
            })
            return {
                "success": False,
                "response": f"Error processing query: {str(e)}",
                "student_id": student_id,
                "query": user_query,
                "error": str(e)
            }
    
    def execute_command(self, user_command: str, student_id: int, db: Session) -> Dict[str, Any]:
        """
        Execute a user command to modify student data
        
        Args:
            user_command: Natural language command (e.g., "Update my phone number")
            student_id: Authenticated student's ID
            db: Database session
            
        Returns:
            Dictionary with execution result
        """
        try:
            # Step 1: Generate UPDATE SQL from natural language
            context = f"""
You are a helpful assistant that converts natural language to SQL UPDATE statements.
CRITICAL SECURITY: You MUST always include student_id = {student_id} in WHERE clause.

Available tables:
1. students - id, full_name, email, phone, date_of_birth, city (use WHERE id = {student_id})
2. education_details - id, student_id, tenth_board, tenth_percentage, twelfth_board, twelfth_percentage (use WHERE student_id = {student_id})

User command: {user_command}

IMPORTANT: If the user input contains obvious typos (e.g., "hderabad" → "Hyderabad", "bangalre" → "Bangalore"), intelligently correct them before generating SQL. Use your knowledge of common city names, board names, and other standard values.

Generate ONLY the SQL UPDATE statement (no explanation, no markdown).
Output ONLY the raw SQL, nothing else.
"""
            
            sql_response = self.llm.invoke(context)
            generated_sql = sql_response.content.strip() if hasattr(sql_response, 'content') else str(sql_response).strip()
            
            # Clean up SQL
            generated_sql = generated_sql.replace("```sql", "").replace("```", "").strip()
            
            # Step 2: Validate SQL safety
            sql_upper = generated_sql.upper()
            if not sql_upper.startswith("UPDATE"):
                return {
                    "success": False,
                    "response": "I can only execute UPDATE commands through this interface.",
                    "student_id": student_id,
                    "command": user_command
                }
            
            # Check for forbidden operations
            for keyword in SafetyConfig.FORBIDDEN_KEYWORDS:
                if keyword in sql_upper:
                    return {
                        "success": False,
                        "response": f"Cannot execute {keyword} operations.",
                        "student_id": student_id,
                        "command": user_command
                    }
            
            # Verify student_id is in WHERE clause
            if f"student_id = {student_id}" not in generated_sql and f"id = {student_id}" not in generated_sql:
                return {
                    "success": False,
                    "response": "Security error: UPDATE must be scoped to your student ID.",
                    "student_id": student_id,
                    "command": user_command
                }
            
            # Step 3: Execute the UPDATE
            db.execute(text(generated_sql))
            db.commit()
            
            # Step 4: Confirm what was changed
            confirm_prompt = f"""
The following SQL was executed successfully: {generated_sql}

Write a brief, friendly confirmation message to the user about what was updated.
Do not mention SQL, table names, column names, student IDs, numeric IDs, or internal system details.
Address the user directly with "you" / "your".
Just confirm the change naturally in one short sentence.
"""
            confirm_response = self.llm.invoke(confirm_prompt)
            response_text = confirm_response.content if hasattr(confirm_response, 'content') else str(confirm_response)

            # Extra guard: strip internal identifier references if model includes them
            response_text = re.sub(r"student\s*id\s*\d+", "your profile", response_text, flags=re.IGNORECASE)
            response_text = re.sub(r"\bid\s*=\s*\d+\b", "", response_text, flags=re.IGNORECASE)
            response_text = re.sub(r"\s{2,}", " ", response_text).strip()

            if "student id" in response_text.lower() or "student_id" in response_text.lower():
                response_text = "Your information has been updated successfully."

            log_ai_event(student_id, "command", {
                "command": user_command,
                "generated_sql": generated_sql,
                "response": response_text,
            })
            
            return {
                "success": True,
                "response": response_text,
                "student_id": student_id,
                "command": user_command
            }
            
        except Exception as e:
            db.rollback()
            log_ai_event(student_id, "command_error", {
                "command": user_command,
                "error": str(e),
            })
            return {
                "success": False,
                "response": f"Error executing command: {str(e)}",
                "student_id": student_id,
                "command": user_command,
                "error": str(e)
            }


# Global agent instance (initialized on app startup)
_agent_instance = None


def get_sql_agent() -> StudentSQLAgent:
    """Get or create the SQL agent singleton"""
    global _agent_instance
    if _agent_instance is None:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable not set")
        _agent_instance = StudentSQLAgent(api_key)
    return _agent_instance
