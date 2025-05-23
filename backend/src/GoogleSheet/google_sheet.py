import os
import json
import logging
from datetime import datetime
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from dotenv import load_dotenv

load_dotenv()

STATE_FILE = "src/utils/last_row.txt"


def read_last_row():
    try:
        with open(STATE_FILE, "r") as f:
            return int(f.read().strip())
    except:
        return 1  # start after header


def save_last_row(row_num):
    with open(STATE_FILE, "w") as f:
        f.write(str(row_num))


class GoogleSheet:
    def __init__(self):
        # === Setup Credentials ===
        scope = [
            "https://spreadsheets.google.com/feeds",
            "https://www.googleapis.com/auth/drive",
        ]
        creds = ServiceAccountCredentials.from_json_keyfile_name(
            "src/GoogleSheet/google_cred.json", scope
        )
        self.client = gspread.authorize(creds)
        # === Open Google Sheet ===
        sheet_id = os.getenv("SHEET_ID")  # Replace with actual ID
        self.sheet = self.client.open_by_key(sheet_id).sheet1

    def append_data(
        self,
        cold_email: str,
        email_address: str,
    ):
        try:
            # === Open Google Sheet ===
            # sheet_id = os.getenv("SHEET_ID")  # Replace with actual ID
            # sheet = self.client.open_by_key(sheet_id).sheet1

            # === Headers (Add if not exist) ===
            headers = [
                "Email",
                "Cold Email",
                "Status",
            ]

            # === Example Video Data ===
            video_data = {
                "Video url": cold_email,
                "Title": email_address,
                "Status": "Pending",
            }

            # === Push to Sheet ===
            row = [video_data[h] for h in headers]
            self.sheet.append_row(row)

            logging.info("Video pushed to Google Sheet.")

        except Exception as e:
            logging.error(f"ERROR when running google sheet append data: {e}")

    def last_sheet_row(self):
        try:
            last_row = self.sheet.row_count
            logging.info(f"Last row in the sheet: {last_row}")
            return last_row
        except Exception as e:
            logging.error(f"ERROR when getting google_sheet.last row: {e}")
            return None

    def get_all_title(self, batch_size=20):
        try:
            last_row = read_last_row()
            start_row = last_row + 1
            end_row = start_row + batch_size - 1
            # Check if the end_row exceeds the last row of the sheet
            if end_row > self.last_sheet_row():
                end_row = self.last_sheet_row()

            range_str = f"A{start_row}:F{end_row}"

            headers = self.sheet.row_values(1)  # get header row (A1:F1)
            result = self.sheet.batch_get([range_str])[0]  # get the batch

            if result:
                save_last_row(end_row)

            json_data = [dict(zip(headers, row)) for row in result]

            return json_data

        except Exception as e:
            logging.error(f"ERROR in googlesheet.get_title: {e}")
            return []
