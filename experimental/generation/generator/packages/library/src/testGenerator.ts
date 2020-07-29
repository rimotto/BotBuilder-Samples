#!/usr/bin/env node
/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as fs from 'fs-extra'
import * as ppath from 'path'

/**
 * Given a transcript and dialog generate a test script.
 * @param path Path to transcript file.
 * @param dialog Name of dialog to test.
 * @param output Directory to put test into.
 * @param mock Whether to mock http requests or not.
 * @param schema Schema to use for test scripts.
 */
export async function generateTest(path: string, dialog: string, output: string, mock: boolean, schema?: string): Promise<string> {
    let transcript = JSON.parse(await fs.readFile(path, 'utf8'))
    await fs.ensureDir(output)
    let outputPath = ppath.resolve(ppath.join(output, ppath.basename(path, ppath.extname(path)) + '.test.dialog'))
    let test: any = {}
    if (schema) {
        test.$schema = ppath.relative(ppath.resolve(schema), ppath.resolve(outputPath))
    }
    test.$kind = 'Microsoft.Test.Script'
    test.dialog = dialog
    let script: object[] = []
    test.script = script
    let luisResponses: object[] = []

    for (let record of transcript) {
        if (isBot(record)) {
            if (record.text) {
                script.push({$kind: 'Microsoft.Test.AssertReply', text: record.text})
            } else if (record.attachments) {
                let assertions: any[] = []
                script.push({$kind: 'Microsoft.Test.AssertReplyActivity', assertions})
                assertions.push(`type == 'message'`)
                objectAssertions(record.attachments, assertions, 'attachments')
            }
        } else if (isUser(record)) {
            script.push({$kind: 'Microsoft.Test.UserSays', 'text': record.text})
        } else if (isConversationUpdate(record)) {
            let membersAdded: string[] = []
            let membersRemoved: string[] = []
            for (let member of record.membersAdded) {
                membersAdded.push(member.name)
            }
            for (let member of record.membersRemoved) {
                membersRemoved.push(member.name)
            }
            script.push({$kind: 'Microsoft.Test.UserConversationUpdate', membersAdded, membersRemoved})
        } else if (mock && isLUIS(record)) {
            // TODO: Make this work.
            // This does not currently work because LUIS does not make use of the HttpClient
            // in TurnContext like the HttpRequestAction.
            luisResponses.push({
                contentType: 'String',
                content: record.value.luisResult
            })
        }
    }

    if (luisResponses.length > 0) {
        test.httpRequestMocks = [
            {
                $kind: 'Microsoft.Test.HttpRequestSequenceMock',
                method: 'GET',
                url: 'https://luis.ai',
                responses: luisResponses
            }
        ]
    }

    await fs.writeJSON(outputPath, test, {spaces: 2})
    return outputPath
}

function isBot(record: any): Boolean {
    return record.type === 'message' && record.from.role === 'bot'
}

function isUser(record: any): Boolean {
    return record.type === 'message' && record.from.role === 'user' && record.text
}

function isConversationUpdate(record: any): Boolean {
    return record.type === 'conversationUpdate'
}

function isLUIS(record: any): Boolean {
    return record.type === 'trace' && record.label === 'LuisV3 Trace'
}

function objectAssertions(object: any, assertions: any[], path: string) {
    if (Array.isArray(object)) {
        assertions.push(`count(${path}) == ${object.length}`)
        for (let i = 0; i < object.length; ++i) {
            let elt = object[i]
            objectAssertions(elt, assertions, path + `[${i}]`)
        }
    } else if (typeof object === 'object') {
        for (let [key, value] of Object.entries(object)) {
            objectAssertions(value, assertions, path + `.${key}`)
        }
    } else if (typeof object === 'string') {
        assertions.push(`${path} == '${object}'`)
    } else {
        assertions.push(`${path} == ${object}`)
    }
}