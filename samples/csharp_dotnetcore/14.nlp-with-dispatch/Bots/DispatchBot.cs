﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Extensions.Logging;

namespace Microsoft.BotBuilderSamples
{
    public class DispatchBot : ActivityHandler
    {
        private ILogger<DispatchBot> _logger;
        private IBotServices _botServices;

        public DispatchBot(IBotServices botServices, ILogger<DispatchBot> logger)
        {
            _logger = logger;
            _botServices = botServices;
        }

        protected override async Task OnMessageActivityAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            // First, we use the dispatch model to determine which cognitive service (LUIS or QnA) to use.
            var recognizerResult = await _botServices.Dispatch.RecognizeAsync(turnContext, cancellationToken);
            
            // Top intent tell us which cognitive service to use.
            var topIntent = recognizerResult.GetTopScoringIntent();
            
            // Next, we call the dispatcher with the top intent.
            await DispatchToTopIntentAsync(turnContext, topIntent.intent, cancellationToken);
        }

        protected override async Task OnMembersAddedAsync(IList<ChannelAccount> membersAdded, ITurnContext<IConversationUpdateActivity> turnContext, CancellationToken cancellationToken)
        {
            const string WelcomeText = "Type a greeting, or a question about the weather to get started.";

            foreach (var member in membersAdded)
            {
                if (member.Id != turnContext.Activity.Recipient.Id)
                {
                    await turnContext.SendActivityAsync(MessageFactory.Text($"Welcome to Dispatch bot {member.Name}. {WelcomeText}"), cancellationToken);
                }
            }
        }

        private async Task DispatchToTopIntentAsync(ITurnContext<IMessageActivity> turnContext, string intent, CancellationToken cancellationToken)
        {
            switch (intent)
            {
                case "l_Home_Automation":
                    await ProcessHomeAutomationAsync(turnContext, cancellationToken);
                    break;
                case "l_Weather":
                    await ProcessWeatherAsync(turnContext, cancellationToken);
                    break;
                case "q_sample-qna":
                    await ProcessSampleQnAAsync(turnContext, cancellationToken);
                    break;
                default:
                    _logger.LogInformation($"Dispatch unrecognized intent: {intent}.");
                    await turnContext.SendActivityAsync(MessageFactory.Text($"Dispatch unrecognized intent: {intent}."), cancellationToken);
                    break;
            }
        }

        private async Task ProcessHomeAutomationAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            _logger.LogInformation("ProcessHomeAutomationAsync");

            var recognizerResult = await _botServices.HomeAutomation.RecognizeAsync(turnContext, cancellationToken);
            var topIntent = recognizerResult.GetTopScoringIntent();

            // Add code to call the appropriate Home Automation logic.

            await turnContext.SendActivityAsync(MessageFactory.Text($"HomeAutomation top intent {topIntent.intent}."), cancellationToken);
        }

        private async Task ProcessWeatherAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            _logger.LogInformation("ProcessWeatherAsync");

            var recognizerResult = await _botServices.Weather.RecognizeAsync(turnContext, cancellationToken);
            var topIntent = recognizerResult.GetTopScoringIntent();

            // Add code to call the weather service.

            await turnContext.SendActivityAsync(MessageFactory.Text($"Weather top intent {topIntent.intent}."), cancellationToken);
        }

        private async Task ProcessSampleQnAAsync(ITurnContext<IMessageActivity> turnContext, CancellationToken cancellationToken)
        {
            _logger.LogInformation("ProcessSampleQnAAsync");

            var results = await _botServices.SampleQnA.GetAnswersAsync(turnContext);
            if (results.Any())
            {
                await turnContext.SendActivityAsync(MessageFactory.Text(results.First().Answer), cancellationToken);
            }
            else
            {
                await turnContext.SendActivityAsync(MessageFactory.Text("Sorry, could not find an answer in the Q and A system."), cancellationToken);
            }
        }
    }
}
