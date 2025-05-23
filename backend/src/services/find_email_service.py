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
from src.llm_config.config import LlmClient, LlmGenerationError

logger = logging.getLogger(__name__)

# pylint: skip-file
class FindEmailService(LlmClient):
    def fix_url(self, url: str) -> str | None:
        if url.startswith("http://") or url.startswith("https://"):
            return url
        elif "." in url:  # basic check to avoid emails or junk
            fixed_url = "https://" + url
            logger.info(f"Fixed URL from '{url}' to '{fixed_url}'")
            return fixed_url
        logger.warning(
            f"Could not fix URL: '{url}' - does not appear to be a valid domain."
        )
        return None

    def get_all_urls(self, base_url):
        try:
            logger.info(f"Fetching all URLs from base: {base_url}")
            response = requests.get(base_url, timeout=15)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, "html.parser")

            links = set()
            for a_tag in soup.find_all("a", href=True):
                full_url = urljoin(base_url, a_tag["href"])
                links.add(full_url)
            logger.info(f"Found {len(links)} URLs from {base_url}.")
            return list(links)
        except requests.RequestException as e:
            logger.error(f"Request error while getting all URLs for {base_url}: {e}")
            return []
        except Exception as e:
            logger.error(
                f"Generic error while getting all URLs for {base_url}: {e}",
                exc_info=True,
            )
            return []

    def get_legit_url(self, urls):
        pattern = re.compile(
            r"(privacy|policy|contact[\s\-]?us|about[\s\-]?us|imprint|legal)",
            re.IGNORECASE,
        )
        matched_urls = [url for url in urls if pattern.search(url)]
        logger.info(
            f"Found {len(matched_urls)} 'legit' URLs (e.g., contact, privacy) from list of {len(urls)} URLs."
        )
        return matched_urls

    def extract_website_from_text(self, text: str) -> str | None:
        try:
            urls = re.findall(
                r"https?://(?:www\.)?[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:/[^\s]*)?", text
            )
            if urls:
                url = urls[0]
                logger.info(
                    f"Extracted website URL: {url} from text: '{text[:100]}...'"
                )
                return url
            logger.warning(
                f"No website URL found in text for FindEmailService.extract_website_from_text: '{text[:100]}...'"
            )
            return None
        except Exception as e:
            logger.error(
                f"Error while extracting website from text: '{text[:100]}...'. Error: {e}",
                exc_info=True,
            )
            return None

    def extract_emails_with_selenium(self, url):
        logger.info(f"Attempting to extract emails from {url} using Selenium.")
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")

        driver = None  # Initialize driver to None for finally block
        emails_found = set()
        try:
            driver = webdriver.Chrome(options=chrome_options)
            driver.get(url)
            time.sleep(3)  # Consider replacing with WebDriverWait for specific elements

            mailto_links = driver.find_elements(
                "xpath", "//a[starts-with(@href, 'mailto:')]"
            )
            for link in mailto_links:
                href = link.get_attribute("href")
                if href:
                    try:
                        email = href.split("mailto:")[1].split("?")[0]
                        if email:
                            emails_found.add(email)
                    except IndexError:
                        logger.warning(f"Could not parse mailto link: {href} on {url}")

            html = driver.page_source
            visible_text = driver.find_element("tag name", "body").text
            combined = html + "\n" + visible_text

            email_re = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
            regex_emails = set(email_re.findall(combined))
            emails_found.update(regex_emails)

            if emails_found:
                logger.info(f"Found emails {emails_found} on {url} using Selenium.")
            else:
                logger.info(f"No emails found on {url} using Selenium.")
            return emails_found
        except Exception as e:
            logger.error(
                f"Error during Selenium email extraction for {url}: {e}", exc_info=True
            )
            return emails_found
        finally:
            if driver:
                driver.quit()

    async def find_email(self, query: str, prev_conservation: PrevConservation = None):
        logger.info(f"Starting find_email process for query: '{query[:100]}...'")
        try:
            base_url = self.extract_website_from_text(text=query)
            if not base_url:
                logger.warning(
                    f"No base URL found in query '{query[:100]}...' for find_email. Cannot proceed."
                )
                return None

            fixed_base_url = self.fix_url(url=base_url)
            if not fixed_base_url:
                logger.warning(
                    f"Invalid base URL '{base_url}' after fixing. Query: '{query[:100]}...'. Cannot proceed."
                )
                return None

            all_emails_found = set()
            urls_to_scan = self.get_all_urls(base_url=fixed_base_url)
            legit_urls = self.get_legit_url(urls=urls_to_scan)
            scan_targets = legit_urls if legit_urls else urls_to_scan

            MAX_URLS_TO_SCAN = 10
            for i, url_to_check in enumerate(scan_targets):
                if i >= MAX_URLS_TO_SCAN:
                    logger.info(
                        f"Reached max URL scan limit ({MAX_URLS_TO_SCAN}) for query '{query[:100]}...'."
                    )
                    break
                logger.info(
                    f"Scanning URL ({i + 1}/{len(scan_targets)}, max {MAX_URLS_TO_SCAN}): {url_to_check} for emails. Query: '{query[:100]}...'"
                )
                emails_from_url = self.extract_emails_with_selenium(url=url_to_check)
                all_emails_found.update(emails_from_url)

            if all_emails_found:
                email_list_str = ", ".join(list(all_emails_found))
                logger.info(
                    f"Found email(s) for query '{query[:100]}...': {email_list_str}. Querying LLM."
                )

                prev_conservations_str = ""
                if (
                    prev_conservation
                    and hasattr(prev_conservation, "prev_conservations")
                    and prev_conservation.prev_conservations
                ):
                    prev_conservations_str = str(prev_conservation.prev_conservations)

                content_for_llm = (
                    EMAIL_SEARCH_PROMPT.format(
                        email_list=email_list_str,
                        prev_conservations=prev_conservations_str,
                    )
                    + f"\n\nOriginal Query: {query}"
                )

                try:
                    response = await self.generate_content(content=content_for_llm)
                    logger.info(
                        f"LLM call successful for find_email, query: '{query[:100]}...'."
                    )
                    return json.loads(response.text)
                except json.JSONDecodeError as e:
                    raw_response_text = (
                        response.text
                        if response and hasattr(response, "text")
                        else "Unknown"
                    )
                    logger.error(
                        f"Failed to decode LLM JSON response in find_email. Query: '{query[:100]}...'. Error: {e}. Response text: '{raw_response_text}'"
                    )
                    raise LlmGenerationError(
                        f"Failed to decode LLM response in find_email: {e}"
                    ) from e
            else:
                logger.info(
                    f"No email addresses found after scanning website for query: '{query[:100]}...'."
                )
                return None
        except LlmGenerationError:
            # Logged by app.py
            raise
        except Exception as e:
            logger.error(
                f"An unexpected error occurred in find_email for query '{query[:100]}...': {e}",
                exc_info=True,
            )
            raise Exception(
                f"An unexpected error occurred in the find_email process: {e}"
            ) from e
# if __name__ == '__main__':
#     url = "https://www.savarobotics.com/"
#     FindEmail().find_email(base_url=url)
