from __future__ import annotations
import sqlite3
from typing import Any
import uuid
from fastapi import FastAPI

from omnidemo.settings import settings


class SqliteDatabase:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn
        self.conn.row_factory = sqlite3.Row
        self.storage = settings.storage_dir

    @staticmethod
    def from_app(app: FastAPI) -> SqliteDatabase:
        """Get the database connection storeed in the app state."""
        db = app.state.db
        if db is None:
            raise RuntimeError("Database connection is not established")
        return db

    @staticmethod
    def connect() -> SqliteDatabase:
        db_exists = settings.sqlite_db.exists()
        conn = sqlite3.connect(settings.sqlite_db)

        # If the db does not exist, populate it with the initial
        # schema from the `initial.sql` file.
        if not db_exists:
            sql_script = settings.sqlite_sql.read_text()
            conn.executescript(sql_script)

        if not settings.storage_dir.exists():
            settings.storage_dir.mkdir(parents=True)

        return SqliteDatabase(conn)

    def generate_uuid(self) -> str:
        return str(uuid.uuid4())

    def insert_row(self, sql: str, params: tuple[Any, ...]) -> AnyDict:
        cursor = self.conn.cursor()
        try:
            cursor.execute(sql, params)
            row_id = cursor.lastrowid
            table = self._get_table_name_from_insert_sql(sql)
            print(f"Row ID: {row_id}, Table: {table}")
            if row_id and table:
                select_query = f"SELECT * FROM {table} WHERE id = ?"
                cursor.execute(select_query, (row_id,))
                row = cursor.fetchone()
                print(f"Row: {row}")
                if row:
                    self.conn.commit()
                    return dict(row)
            raise RuntimeError("Row not found after insert")
        except sqlite3.Error as e:
            raise RuntimeError(f"Failed to insert row: {e}")

    def fetch_rows(self, sql: str, params: AnyTuple = ()) -> list[AnyDict]:
        cursor = self.conn.cursor()
        try:
            cursor.execute(sql, params)
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
        except sqlite3.Error as e:
            raise RuntimeError(f"Failed to fetch rows: {e}")

    def fetch_one(self, sql: str, params: AnyTuple = ()) -> AnyDict:
        rows = self.fetch_rows(sql, params)
        if rows:
            return rows[0]
        raise RuntimeError("No rows found")

    def execute(self, sql: str, params: AnyTuple = ()) -> None:
        cursor = self.conn.cursor()
        try:
            cursor.execute(sql, params)
            self.conn.commit()
        except sqlite3.Error as e:
            raise RuntimeError(f"Failed to execute SQL: {e}")

    def close(self):
        self.conn.close()

    def _get_table_name_from_insert_sql(self, sql: str) -> str | None:
        """
        Extract the table name from a simple INSERT INTO SQL statement:

            INSERT INTO table_name (column1, column2) ...

        The table name should be unquoted.
        """
        sql_words = sql.lower().split()
        if sql_words[:2] == ["insert", "into"]:
            return sql_words[2]


AnyTuple = tuple[Any, ...]
AnyDict = dict[str, Any]
