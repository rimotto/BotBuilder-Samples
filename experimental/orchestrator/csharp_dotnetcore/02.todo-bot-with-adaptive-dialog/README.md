﻿# Todo bot with LUIS

This sample demonstrates using [Adaptive dialog][1],  [Language Generation][2] features with Orchestrator to demonstrate an end-to-end ToDo bot in action including support for interruptions.

This sample demonstrates use of Orchestrator as a recognizer with [Adaptive Dialogs](https://aka.ms/adaptive-dialogs)

## Prerequisites

This sample **requires** prerequisites in order to run.
- Bot project must target x64 platform
- Install latest supported version of [Visual C++ Redistributable](https://support.microsoft.com/en-gb/help/2977003/the-latest-supported-visual-c-downloads)
- Install latest [Bot Framework Emulator](https://github.com/microsoft/BotFramework-Emulator/releases)
- [.NET Core SDK](https://aka.ms/dotnet-core-applaunch?framework=Microsoft.AspNetCore.App&framework_version=3.1.0&arch=x64&rid=win10-x64) version 3.1
  ```bash
  > dotnet --version
  ```
- Install BF CLI with Orchestrator plugin
    - Install bf cli 
    ```bash
    > npm i -g @microsoft/botframework-cli
    ```
    - Install bf orchestrator
    ```bash
    > bf plugins:install @microsoft/bf-orchestrator-cli@beta
    ```
      If you have previously installed bf orchestrator plugin, uninstall that version and then run the install command again.
      Uninstall command:
    ```bash
    > bf plugins:uninstall @microsoft/bf-orchestrator-cli
    ```
    - Make sure bf orchestrator command is working and shows all available orchestrator commands
    ```bash
    > bf orchestrator
    ```
    
## To try this bot sample

- Clone the repository
    ```bash
    > git clone https://github.com/microsoft/botbuilder-samples.git
    ```
- CD experimental/orchestrator/csharp_dotnetcore/02.todo-bot-with-adaptive-dialog
    ```bash
    > cd experimental/orchestrator/csharp_dotnetcore/02.todo-bot-with-adaptive-dialog
    ```
- Configure Orchestrator
    - Download Orchestrator base model
    ```bash
    > mkdir model
    > bf orchestrator:basemodel:get --out ./model
    ```
    - Build the Orchestrator snapshot
    ```bash
    > mkdir generated
    > bf orchestrator:build --in ./Dialogs --out ./generated --model ./model
    ```
    - Verify appsettings.json has the following:

       ```
       "orchestrator": {
          "ModelPath": ".\\model",
          "SnapShotPaths": {
             "ViewToDoDialog": ".\\generated\\ViewToDoDialog.blu",
             "RootDialog": ".\\generated\\RootDialog.blu",
             "GetUserProfileDialog": ".\\generated\\GetUserProfile.blu",
             "DeleteToDoDialog": ".\\generated\\DeleteToDoDialog.blu",
             "AddToDoDialog": ".\\generated\\AddToDoDialog.blu"
          }
       }
       ```

- Run the bot from a terminal or from Visual Studio, choose option A or B.
    A) From a terminal

    ```bash
    > cd experimental/orchestrator/csharp_dotnetcore/02.todo-bot-with-adaptive-dialog
    > dotnet run
    ```
    B) Or from Visual Studio

    - Launch Visual Studio
    - File -> Open -> Project/Solution
    - Navigate to `Orchestrator` folder
    - Select `OrchestratorSamples.sln` file
    - Right click on `02.todo-bot-with-adaptive-dialog` project in the solution and 'Set as Startup Project'
    - Press `F5` to run the project

## Connect to the bot using Bot Framework Emulator

- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`

## Further reading
- [Bot Framework Documentation](https://docs.botframework.com)
- [BF Orchestrator Command Usage](https://github.com/microsoft/botframework-sdk/blob/main/Orchestrator/docs/BFOrchestratorUsage.md)
- [Bot Basics](https://docs.microsoft.com/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0)
- [Activity processing](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-activity-processing?view=azure-bot-service-4.0)
- [Azure Bot Service Introduction](https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0)
- [Azure Bot Service Documentation](https://docs.microsoft.com/azure/bot-service/?view=azure-bot-service-4.0)
- [.NET Core CLI tools](https://docs.microsoft.com/en-us/dotnet/core/tools/?tabs=netcore2x)
- [Azure CLI](https://docs.microsoft.com/cli/azure/?view=azure-cli-latest)
- [Azure Portal](https://portal.azure.com)
- [Channels and Bot Connector Service](https://docs.microsoft.com/en-us/azure/bot-service/bot-concepts?view=azure-bot-service-4.0)

[1]:https://aka.ms/adaptive-dialogs
[2]:https://aka.ms/language-generation
[3]:../../../../samples/csharp_dotnetcore/06.using-cards
[4]:https://botbuilder.myget.org/gallery/botbuilder-declarative
[5]:https://luis.ai
[6]:#LUIS-Setup
[7]:https://github.com/Microsoft/botbuilder-tools
[8]:https://nodejs.org/en/
[9]:https://docs.microsoft.com/en-us/azure/cognitive-services/luis/luis-how-to-account-settings#authoring-key
[10]:https://docs.microsoft.com/en-us/azure/cognitive-services/luis/luis-concept-keys
[extension]:https://marketplace.visualstudio.com/items?itemName=tomlm.vscode-dialog-debugger