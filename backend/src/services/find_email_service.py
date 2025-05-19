import re
import time
import json
import logging
from urllib.parse import urljoin
from bs4 import BeautifulSoup
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from src.utils.pydantic_schema import PrevConservation
from src.services import EMAIL_SEARCH_PROMPT
from src.llm_config.config import LlmClient


class FindEmailService(LlmClient):
    def get_all_urls(self, base_url):
        try:
            response = requests.get(base_url, timeout=15)
            soup = BeautifulSoup(response.text, "html.parser")

            links = set()
            for a_tag in soup.find_all("a", href=True):
                full_url = urljoin(base_url, a_tag["href"])
                links.add(full_url)

            return list(links)

        except Exception as e:
            logging.error(f"Error: {e}")
            return []

    def get_legit_url(self, urls):
        pattern = re.compile(
            r"(privacy|policy|contact[\s\-]?us)", re.IGNORECASE)
        matched_urls = [url for url in urls if pattern.search(url)]

        return matched_urls

    def extract_emails_with_selenium(self, url):
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        driver = webdriver.Chrome(options=chrome_options)

        try:
            driver.get(url)
            time.sleep(3)

            # extract mailto emails from href attributes (without clicking)
            mailto_links = driver.find_elements(
                "xpath", "//a[starts-with(@href, 'mailto:')]"
            )
            mailto_emails = set()
            for link in mailto_links:
                href = link.get_attribute("href")
                if href:
                    email = href.split("mailto:")[1].split("?")[0]
                    mailto_emails.add(email)

            # extract emails from visible text + html
            html = driver.page_source
            visible_text = driver.find_element("tag name", "body").text
            combined = html + "\n" + visible_text

            email_re = re.compile(
                r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
            regex_emails = set(email_re.findall(combined))

            # combine both sets
            return mailto_emails.union(regex_emails)

        except Exception as e:
            print("Error:", e)
            return set()

        finally:
            driver.quit()

    def find_email(
        self, base_url, query: str, prev_conservation: PrevConservation = None
    ):
        try:
            email_address_list = []
            urls = self.get_all_urls(base_url=base_url)
            all_legit_urls = self.get_legit_url(urls=urls)
            if all_legit_urls:
                print("find a url")
                for url in all_legit_urls:
                    email = self.extract_emails_with_selenium(url=url)
                    if email:
                        print(f"Find the email: {email} from url {url}")
                        email_address_list.append(email)
            elif urls:
                print("didnt find any legit url")
                for url in urls:
                    email = self.extract_emails_with_selenium(url=url)
                    if email:
                        print(f"Find one email {email} from url {url}")
                        email_address_list.append(email)
            if email_address_list:
                try:
                    if prev_conservation:
                        prev_conservation = EMAIL_SEARCH_PROMPT.format(
                            prev_conservations=prev_conservation,
                            email_list=email_address_list
                        )
                    response = self.generate_content(
                        content=EMAIL_SEARCH_PROMPT.format(email_list=email_address_list,
                                                           prev_conservations=prev_conservation)
                                                           + query
                    )

                    return json.loads(response.text)
                except Exception as e:
                    logging.error(
                        f"Failed to generate email service content: {e}")
                    return None
            else:
                return None
        except Exception as e:
            logging.error(f"Error when running find_email: {e}")
            return None


# if __name__ == '__main__':
#     url = "https://www.savarobotics.com/"
#     FindEmail().find_email(base_url=url)
