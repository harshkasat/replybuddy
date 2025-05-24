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

    def update_email(
        self,
        row_index: int,
        cold_email: str,
        email_address: str,
    ):
        try:
            values = [[email_address, cold_email, "Pending"]]  # G, H, I
            range_str = f"G{row_index}:I{row_index}"  # Target that row
            self.sheet.update(range_str, values)
            logging.info(f"Updated row {row_index} in G:H:I")
        except gspread.exceptions.APIError as e:
            logging.error(f"ERROR while updating G:H:I in row {row_index}: {e}")


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

            json_data = []
            for i, row in enumerate(result):
                row_dict = dict(zip(headers, row))
                row_dict["current_index"] = start_row + i
                json_data.append(row_dict)

            return json_data

        except Exception as e:
            logging.error(f"ERROR in googlesheet.get_title: {e}")
            return []
