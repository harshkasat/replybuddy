from src.services import EMAIL_SEARCH_PROMPT

email_address_list = ["test@test.com", "test2@test.com", "test3@test.com"]

print(
    EMAIL_SEARCH_PROMPT.format(
        email_list="\n".join(email_address_list), prev_conservations=""
    )
)
