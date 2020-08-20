// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const { ComponentDialog } = require('botbuilder-dialogs');
const { NumberEntityRecognizer, CancelAllDialogs, BeginDialog, OnIntent, LuisAdaptiveRecognizer, ForEach, OnConversationUpdateActivity, IfCondition, AdaptiveDialog, SendActivity, TemplateEngineLanguageGenerator } = require('botbuilder-dialogs-adaptive');
const { Templates } = require('botbuilder-lg');
const { StringExpression, BoolExpression, NumberExpression } = require('adaptive-expressions');
const { OrchestratorAdaptiveRecognizer } = require('botbuilder-ai-orchestrator');
const { AddToDoDialog } = require('../addToDoDialog/addToDoDialog');
const { DeleteToDoDialog } = require('../deleteToDoDialog/deleteToDoDialog');
const { ViewToDoDialog } = require('../viewToDoDialog/viewToDoDialog');

const path = require('path');

const ROOT_DIALOG = 'ROOT_DIALOG';

class RootDialog extends ComponentDialog {
    constructor() {
        super(ROOT_DIALOG);
        const lgFile = Templates.parseFile(path.join(__dirname, 'rootDialog.lg'));
        const rootDialog = new AdaptiveDialog(ROOT_DIALOG).configure({
            generator: new TemplateEngineLanguageGenerator(lgFile),
            recognizer: this.createOrchestratorRecognizer(),
            triggers: [
                new OnConversationUpdateActivity(this.welcomeUserSteps()),
                new OnIntent('Greeting', [], [new SendActivity('${HelpRootDialog()}')]),
                new OnIntent('AddItem', [], [new BeginDialog('ADD_TO_DO_DIALOG')], '#AddItem.Score >= 0.5'),
                new OnIntent('DeleteItem', [], [new BeginDialog('DELETE_TO_DO_DIALOG')], '#DeleteItem.Score >= 0.5'),
                new OnIntent('ViewItem', [], [new BeginDialog('VIEW_TO_DO_DIALOG')], '#ViewItem.Score >= 0.5'),
                // Come back with LG template based readback for global help
                new OnIntent('Help', [], [new SendActivity('${HelpRootDialog()}')], '#Help.Score >= 0.8'),
                new OnIntent('Cancel', [], [
                    // This is the global cancel in case a child dialog did not explicit handle cancel.
                    new SendActivity('Cancelling all dialogs..'),
                    // SendActivity supports full language generation resolution.
                    // See here to learn more about language generation
                    // https://aka.ms/language-generation
                    new SendActivity('${WelcomeActions()}'),
                    new CancelAllDialogs()
                ], '#Cancel.Score >= 0.8')
            ]
        });

        // Add named dialogs to the DialogSet. These names are saved in the dialog state.
        this.addDialog(rootDialog);

        // Add all child dialogs
        this.addDialog(new AddToDoDialog());
        this.addDialog(new DeleteToDoDialog());
        this.addDialog(new ViewToDoDialog());

        // The initial child Dialog to run.
        this.initialDialogId = ROOT_DIALOG;
    }

    createOrchestratorRecognizer() {
        if (process.env.ModelPath === "" || process.env.RootDialogSnapshotPath === "")
        {
            throw `Sorry, you need to configure your Orchestrator recognizer. Please follow instructions in readme.md and update .env file.`;        
        }
        let orc = new OrchestratorAdaptiveRecognizer()
        orc.modelPath = new StringExpression(process.env.ModelPath);
        orc.snapshotPath = new StringExpression(process.env.RootDialogSnapshotPath);
        return orc;
    }
    
    welcomeUserSteps() {
        return [
            // Iterate through membersAdded list and greet user added to the conversation.
            new ForEach().configure({
                itemsProperty: new StringExpression('turn.activity.membersAdded'),
                actions: [
                    // Note: Some channels send two conversation update events - one for the Bot added to the conversation and another for user.
                    // Filter cases where the bot itself is the recipient of the message.
                    new IfCondition().configure({
                        condition: new BoolExpression('$foreach.value.name != turn.activity.recipient.name'),
                        actions: [
                            new SendActivity('${IntroMessage()}')
                        ]
                    })
                ]
            })
        ];
    }
}

module.exports.RootDialog = RootDialog;
