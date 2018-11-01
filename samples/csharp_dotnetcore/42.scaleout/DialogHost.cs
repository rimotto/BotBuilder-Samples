﻿// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

using System.Linq;
using System.Threading.Tasks;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Builder.Dialogs;
using Microsoft.Bot.Schema;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Microsoft.BotBuilderSamples
{
    /// <summary>
    /// The essential code for running a dialog. Th eexecution of the dialog is treated here as a pure function call.
    /// The input being the existing or old state and the inbound Activity and the result being the updated or new state
    /// and the Activities that should be sent. The assumption is that this code can be re-run without causing any
    /// unintended or harmful side-effects. For example, any outbound service calls made directly from the
    /// dialog implementation should be idempotent.
    /// </summary>
    public static class DialogHost
    {
        // The serializer to use. Moving the serialization to this layer will make the storage layer more pluggable.
        private static readonly JsonSerializer StateJsonSerializer = new JsonSerializer() { TypeNameHandling = TypeNameHandling.All };

        /// <summary>
        /// A function to run a dialog while buffering the outbound Activities.
        /// </summary>
        /// <param name="rootDialog">THe dialog to run.</param>
        /// <param name="activity">The inbound Activity to run it with.</param>
        /// <param name="oldState">Th eexisting or old state.</param>
        /// <returns>An array of Activities 'sent' from the dialog as it executed. And the updated or new state.</returns>
        public static async Task<(Activity[], JObject)> RunAsync(Dialog rootDialog, Activity activity, JObject oldState)
        {
            // A custom adapter and corresponding TurnContext that buffers any messages sent.
            var adapter = new DialogHostAdapter();
            var turnContext = new TurnContext(adapter, activity);

            // Run the dialog using this TurnContext with the existing state.
            JObject newState = await RunTurnAsync(rootDialog, turnContext, oldState);

            // The result is a set of activities to send and a replacement state.
            return (adapter.Activities.ToArray(), newState);
        }

        /// <summary>
        /// Execute the turn of the bot. The functionality here closely resembles that which is found in the
        /// IBot.OnTurnAsync method in an implementation that is using the regular BotFrameworkAdapter.
        /// Also here in this example the focus is explicitly on Dialogs but the pattern could be adapted
        /// to other conversation modeling abstractions.
        /// </summary>
        /// <param name="rootDialog">The dialog to be run.</param>
        /// <param name="turnContext">The ITurnContext instance to use. Note this is not the one passed into the IBot OnTurnAsync.</param>
        /// <param name="state">The existing or old state of the dialog.</param>
        /// <returns>The updated or new state of the dialog.</returns>
        private static async Task<JObject> RunTurnAsync(Dialog rootDialog, TurnContext turnContext, JObject state)
        {
            // For this example we are only interested in Message Activities.
            if (turnContext.Activity.Type == ActivityTypes.Message)
            {
                // If we have some state, deserialize it. (This mimics the shape produced by BotState.cs.)
                var dialogState = state?[nameof(DialogState)]?.ToObject<DialogState>(StateJsonSerializer);

                // A custom accessor is used to pass a handle on the state to the dialog system.
                var accessor = new RefAccessor<DialogState>(dialogState);

                // The following is regular dialog driver code.
                var dialogs = new DialogSet(accessor);
                dialogs.Add(rootDialog);

                var dialogContext = await dialogs.CreateContextAsync(turnContext);
                var results = await dialogContext.ContinueDialogAsync();

                if (results.Status == DialogTurnStatus.Empty)
                {
                    await dialogContext.BeginDialogAsync("root");
                }

                // Serialize the result (available as Value on the accessor), and put its value back into a new JObject.
                return new JObject { { nameof(DialogState), JObject.FromObject(accessor.Value, StateJsonSerializer) } };
            }

            return state;
        }
    }
}
