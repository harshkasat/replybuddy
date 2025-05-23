import logging
from src.services.email_service import EmailService
from src.services.find_email_service import FindEmailService
from src.GoogleSheet.google_sheet import GoogleSheet


class YcService:
    async def _get_company_info_batch(self):
        try:
            gs = GoogleSheet().get_all_title(batch_size=5)
            logging.info(f"Google Sheet data retrieved successfully")
            if gs is None:
                logging.error("Google Sheet data is None")
                return None
            return gs
        except Exception as e:
            logging.error(f"Error retrieving Google Sheet data: {e}")
            return None

    async def _find_email(self, company_url: str) -> str:
        try:
            service = FindEmailService()
            response = await service.find_email(company_url)
            logging.info("Get the compnay email successfully")
            if response is None:
                logging.error("Find email generation returned None")
                return None
            return response["response"]["message"]
        except Exception as e:
            logging.error(f"Error when getting the email: {e}")
            return None

    async def _get_cold_email(self, company_info: str) -> str:
        try:
            service = EmailService()
            response = await service.email_service(company_info)
            logging.info("Get the cold email successfully")
            if response is None:
                logging.error("Cold email generation returned None")
                return None
            return response["response"]["message"]
        except Exception as e:
            logging.error(f"Error when getting the cold email: {e}")
            return None

    async def _push_to_sheet(self, cold_email: str, email_address: str):
        try:
            gs = GoogleSheet()
            gs.append_data(cold_email=cold_email, email_address=email_address)
            logging.info("Cold email pushed to Google Sheet successfully")
        except Exception as e:
            logging.error(f"Error when pushing to Google Sheet: {e}")
            return None

    async def yc_service(self):
        try:
            count = 0
            print("Start the YcService")
            # get comapany info from google sheet
            company_info_batch = await self._get_company_info_batch()
            logging.info("Get the company info batch successfully")
            if company_info_batch is None:
                logging.error("Company info is None")
                return None
            for company in company_info_batch:
                count += 1
                print(count)
                # get company details
                company_name = company["Company Name"]
                website_url = company["Website"]
                company_description = company["Company Description"]
                industry = company["Industry"]
                founder_name = company["Founder Name"]

                # get company email
                email_address = await self._find_email(company_url=website_url)
                logging.info("Get the company email successfully")
                if email_address is None:
                    logging.error("Email address is None")
                    continue

                # get cold email
                company_info = (
                    f"Company Name: {company_name}, Website: {website_url}, "
                    f"Company Description: {company_description}, Industry: {industry}, "
                    f"Founder Name: {founder_name}"
                )

                cold_email = await self._get_cold_email(company_info=company_info)
                if cold_email is None:
                    logging.error("Cold email is None")
                    continue

                # push to google sheet
                print(f"Cold email: {cold_email}")
                print(f"Email address: {email_address}")
        except Exception as e:
            logging.error(f"Error in YcService: {e}")
            return None
