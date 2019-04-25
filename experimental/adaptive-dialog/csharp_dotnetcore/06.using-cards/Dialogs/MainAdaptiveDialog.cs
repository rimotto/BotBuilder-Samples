﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Builder.Dialogs.Adaptive;
using Microsoft.Bot.Builder.Dialogs.Adaptive.Input;
using Microsoft.Bot.Builder.Dialogs.Adaptive.Steps;
using Microsoft.Bot.Builder.Dialogs.Choices;

namespace Microsoft.BotBuilderSamples
{
    public class MainAdaptiveDialog : ComponentDialog
    {
        public MainAdaptiveDialog()
            : base(nameof(MainAdaptiveDialog))
        {
            // Create instance of adaptive dialog. 
            var rootDialog = new AdaptiveDialog(nameof(AdaptiveDialog))
            {
                // These steps are executed when this Adaptive Dialog begins
                Steps = OnBeginDialogSteps(),
            };

            // Add named dialogs to the DialogSet. These names are saved in the dialog state.
            AddDialog(rootDialog);

            // The initial child Dialog to run.
            InitialDialogId = nameof(AdaptiveDialog);
        }
        private static List<IDialog> OnBeginDialogSteps()
        {
            return new List<IDialog>()
            {
                // Present choices for card types
                new ChoiceInput()
                {
                    Prompt = new ActivityTemplate("[CardChoice]"),
                    Property = "turn.cardChoice",
                    Style = ListStyle.Auto,
                    Choices = new List<Choice>()
                    {
                        new Choice() { Value = "Cancel" },
                        new Choice() { Value = "Adaptive card" },
                        new Choice() { Value = "Animation card" },
                        new Choice() { Value = "Audio card" },
                        new Choice() { Value = "Hero card" },
                        new Choice() { Value = "Receipt card" },
                        new Choice() { Value = "Signin card" },
                        new Choice() { Value = "Thumbnail card" },
                        new Choice() { Value = "Video card" },
                        new Choice() { Value = "All cards" }
                    }
                },
                new SwitchCondition()
                {
                    // Switch on value property. Choice prompt outputs the following payload -
                    // { "value": "<recognized value>", "index": <index-in-choice-list>,"score": 1.0, "synonym": "<synonym>"}
                 
                    // file bug for end of conversation bug for skills for post //build.
                    Condition = "turn.cardChoice.value",
                    Cases = new List<Case>() {
                        new Case("'Adaptive card'",  new List<IDialog>() { new SendActivity("[AdativeCardRef]") } ),
                        new Case("'Animation card'", new List<IDialog>() { new SendActivity("[AnimationCard]") } ),
                        new Case("'Audio card'",     new List<IDialog>() { new SendActivity("[AudioCard]") } ),
                        new Case("'Hero card'",      new List<IDialog>() { new SendActivity("[HeroCard]") } ),
                        new Case("'Receipt card'",   new List<IDialog>() { new SendActivity("[ReciptCard]") } ),
                        new Case("'Signin card'",    new List<IDialog>() { new SendActivity("[SigninCard]") } ),
                        new Case("'Thumbnail card'", new List<IDialog>() { new SendActivity("[ThumbnailCard]") } ),
                        new Case("'Video card'",     new List<IDialog>() { new SendActivity("[VideoCard]") } ),
                        new Case("'Cancel'",         new List<IDialog>() { new SendActivity("Sure."), new EndDialog() } ),
                                            },
                    Default = new List<IDialog>()
                    {
                        new SendActivity("[AllCards]")
                    }
                },
                // Delete this property so we are not stuck in an infinite loop.
                // Without this, choiceInput will skip the prompt due to value from prior turn.
                // TODO: revisit this - we might not need this
                new DeleteProperty()
                {
                    Property = "turn.cardChoice"
                },
                // Go back and repeat this dialog. User can choose 'cancel' to cancel the dialog.
                new RepeatDialog()
            };
        }
    }
}
