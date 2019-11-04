## Teams File Upload Bot

Bot Framework v4 file upload bot sample for Teams.

This bot has been created using [Bot Framework](https://dev.botframework.com), it shows how to
upload files to Teams from a bot and how to receive a file send to a bot as an attachment.

## Prerequisites


- [.NET Core SDK](https://dotnet.microsoft.com/download) version 2.1

  ```bash
  # determine dotnet version
  dotnet --version
  ```
  
- Microsoft Teams is installed and you have an account

## To try this sample

### Clone the repo
- Clone the repository

    ```bash
    git clone https://github.com/Microsoft/botbuilder-samples.git
    ```

### Ngrok
- Download and install [ngrok](https://ngrok.com/download)
- In terminal navigate to where ngrok is installed and run: 

```bash
ngrok http -host-header=rewrite 3978
```
- Copy/paste the ```https``` **NOT** the ```http``` web address into notepad as you will need it later

### Creating the bot registration
- Create a new bot [here](https://dev.botframework.com/bots/new)
- Enter a```Display name``` and ```Bot handle```
- In the ```Messaging endpoint``` enter the https address from Ngrok and add ```/api/messages``` to the end
  - EX: ```https://7d899fbb.ngrok.io/api/messages``` 
- Open the ```Create Microsoft App ID and password``` link in a new tab
- Click on the ```New registration``` button 
- Enter a name, and select the ```Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)```
- Click ```Register```
- Copy & paste the ```Application (client) ID``` field into notepad. This is your botID.
- Click on ```Certificates & secrets``` tab on the left
- Click ```New client secret```
- Enter a name, select `Never`, and click ```Add```
- Copy & paste the password into notepad. This is your app password.
- Go back to the bot registration tab and enter the ```botID``` into the app ID field
- Scroll down, agree to the Terms, and click ```Register```
- Click the ```Microsoft Teams``` icon on the next screen
- Click ```Save```

### Visual Studio
- Launch Visual Studio
- Navigate to and open the `samples/csharp_dotnet/56.teams-file-upload` directory
- Open the ```appsettings.json``` file
- Paste your botID value into the ```MicrosoftAppId``` field 
- Put the password into the ```MicrosoftAppPassword``` field
- Save the file
- Open the ```manifest.json```
- Replace your botID everywhere you see the place holder string ```<<YOUR-MICROSOFT-BOT-ID>>```


- Run the bot:

 A) From a terminal

  ```bash
  # run the bot
  dotnet run
  ```

  B) Or from Visual Studio

  - File -> Open -> Project/Solution
  - Navigate to `samples/csharp_dotnetcore/56.teams-file-upload` folder
  - Select `TeamsFileUpload.csproj` file
  - Press `F5` to run the project

### Teams - App Studio
- Launch Microsoft Teams
- In the bar at the top of Teams search for and select ```App Studio``` 
- Click the ```Manifest editor``` tab
- Click ```Import an existing app```
- Navigate to and select the `manifest.json` file from the previous step
- Click on the `TeamsFileUpload` card
- Click ```Test and distribute``` on the left hand side
- Click the ```Install``` button

| To install bot in a personal chat... | To install in a group chat... | To install in team chat... |
|:-------------------- | :------------------------- | :-----------------------|
| 1. Click ```Add``` button| This feature does not work in this scope. |  This feature does not work in this scope.  |

### Interacting with the bot

If you send a message to the bot it will respond with a card that will prompt you to upload a file. The file that's being uploaded is the `teams-logo.png` in the `Files` directory in this sample. You can message the bot again to receive another prompt. 

You can also send a file to the bot as an attachment in the message compose section in Teams.

