import requests

def get_slack_users(token):
    url = "https://slack.com/api/users.list"
    headers = {
        "Authorization": f"Bearer {token}",
    }
    params = {
        "limit": 200
    }
    users = []
    cursor = None

    while True:
        if cursor:
            params['cursor'] = cursor
        response = requests.get(url, headers=headers, params=params).json()
        users.extend(response['members'])
        cursor = response.get('response_metadata', {}).get('next_cursor')
        if not cursor:
            break
    
    return users

def update_user_email(user_id, new_email, token):
    url = "https://slack.com/api/users.profile.set"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json;charset=utf-8"
    }
    payload = {
        "user": user_id,
        "profile": {
            "email": new_email
        }
    }
    response = requests.post(url, headers=headers, json=payload)
    return response.json()

# Your admin user token
admin_token = "xoxp-#####"

# Fetch all users
all_users = get_slack_users(admin_token)

# Iterate over each user and update their email if necessary
for user in all_users:
    # Extract the current email address
    current_email = user.get('profile', {}).get('email', '')
    # Check if the user's email needs to be updated
    if current_email.endswith('@esn-heidelberg.de'):
        # Generate the new email address
        new_email_address = current_email.replace('@esn-heidelberg.de', '@esn-heidelberg.com')
        # Update the user's email
        update_response = update_user_email(user['id'], new_email_address, admin_token)
        
        # Print the response for troubleshooting
        print(f"Updating {user['name']}'s email from {current_email} to {new_email_address}")
        print(update_response)

# Print user data for troubleshooting
# for user in all_users:
#     print(f"User ID: {user['id']} - Name: {user['name']} - Email: {user.get('profile', {}).get('email', 'No email')} - Deleted: {user['deleted']} - Is Bot: {user['is_bot']}")

# # User ID of the user whose email you want to update
# user_id_to_update = "U41BEKNFK"

# # New email to assign to the user
# new_email_address = "gwen@esn-heidelberg.com"

# # Update the user's email
# update_response = update_user_email(user_id_to_update, new_email_address, admin_token)

# # Print the response for troubleshooting
# print(update_response)