/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as vscode from 'vscode';
import * as util from '../util';
import { TemplatesStatus } from '../templatesStatus';
import * as path from 'path';

/**
 * Code completions provide context sensitive suggestions to the user.
 * @see https://code.visualstudio.com/api/language-extensions/programmatic-language-features#show-code-completion-proposals
 * @export
 * @class LGCompletionItemProvider
 * @implements [CompletionItemProvider](#vscode.CompletionItemProvider)
 */

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('*', new LGCompletionItemProvider(), '{', '(', '[', '.', '\n', '#', '=', ','));
}

class LGCompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
        if (!util.isLgFile(document.fileName)) {
            return;
        }

        const lineTextBefore = document.lineAt(position.line).text.substring(0, position.character);

        if (/\[[^\]]*\]\([^)]*$/.test(lineTextBefore) && !util.isInFencedCodeBlock(document, position)) {
            // []() import suggestion
            const paths = Array.from(new Set(TemplatesStatus.lgFilesOfWorkspace));

            return paths.filter(u => document.uri.fsPath !== u).reduce((prev, curr) => {
                const relativePath = path.relative(path.dirname(document.uri.fsPath), curr);
                const item = new vscode.CompletionItem(relativePath, vscode.CompletionItemKind.Reference);
                item.detail = curr;
                prev.push(item);
                return prev;
            }, []);
        } else if (/\$\{[^}]*$/.test(lineTextBefore)) {
            // buildin function prompt in expression
            const items: vscode.CompletionItem[] = [];
            const functions = util.getAllFunctions(document.uri);
            functions.forEach((value, key) => {
                const completionItem = new vscode.CompletionItem(key);
                const returnType = util.getreturnTypeStrFromReturnType(value.returntype);
                completionItem.detail = `${key}(${value.params.join(", ")}): ${returnType}`;
                completionItem.documentation = value.introduction;
                completionItem.insertText = `${key}(${value.params.map(u => u.split(':')[0].trim()).join(", ")})`;
                items.push(completionItem);
            });

            return items;
        }  else if (this.isStartStructure(document, position)) {
            // structure name and key suggestion
            const items: vscode.CompletionItem[] = [];
            util.cardTypes.forEach(value => {
                const completionItem = new vscode.CompletionItem(value);
                completionItem.detail = `create ${value} structure`;
                let insertTextArray = util.cardPropDict.Others;
                if (value === 'CardAction' || value === 'Suggestions' || value === 'Attachment' || value === 'Activity') {
                    insertTextArray = util.cardPropDict[value];
                } else if (value.endsWith('Card')){
                    insertTextArray = util.cardPropDict.Cards;
                }

                completionItem.insertText = value + '\r\n' + insertTextArray.map(u => `\t${u.name}=${u.placeHolder}`).join('\r\n') + '\r\n';
                items.push(completionItem);
            });

            return items;
        } else if (this.isInStructure(document, position).isInStruct && /^\s*$/.test(lineTextBefore)) {
            const structureName = this.isInStructure(document, position).struType;
            const items: vscode.CompletionItem[] = []; 

            const nameToPropertiesMapping = Object.entries(util.cardPropDictFull);
            const propertiesMapping = nameToPropertiesMapping.find(u => u[0].toLowerCase() === structureName.toLowerCase());
            if (propertiesMapping !== undefined) {
                const properties = propertiesMapping[1];
                properties.forEach(propertyItem => {
                    const completionItem = new vscode.CompletionItem(propertyItem.name);
                    completionItem.detail = `create property ${propertyItem.name}`;
                    const placeHolder = 'placeHolder' in propertyItem ? propertyItem['placeHolder'] : `{${propertyItem.name}}`
                    completionItem.insertText = propertyItem.name + '=' + placeHolder;
                    items.push(completionItem);
                })
                return items;
            }
        } else if (/^>\s!#/.test(lineTextBefore)) {
            // options suggestion following "> !#"
            const items: vscode.CompletionItem[] = [];
            if (/>\s!#$/.test(lineTextBefore)) {
                this.AddToCompletion(optionsMap.options, items);
            } else {
                if (/>\s!#\s*@strict\s*=$/.test(lineTextBefore)) {
                    this.AddToCompletion(optionsMap.strictOptions, items);
                } else if (/>\s!#\s*@replaceNull\s*=$/.test(lineTextBefore)) {
                    this.AddToCompletion(optionsMap.replaceNullOptions, items);
                } else if (/>\s!#\s*@lineBreakStyle\s*=$/.test(lineTextBefore)) {
                    this.AddToCompletion(optionsMap.lineBreakStyleOptions, items);
                } else if (/>\s!#\s*@Exports\s*=$/.test(lineTextBefore) || (/>\s!#\s*@Exports\s*=/.test(lineTextBefore) && /,\s*$/.test(lineTextBefore))) {
                    const templatesOptions = TemplatesStatus.templatesMap.get(document.uri.fsPath).templates.toArray();
                    for (const template in templatesOptions) {
                        const templateName = templatesOptions[template].name;
                        const completionItem = new vscode.CompletionItem(" " + templateName);
                        completionItem.detail = " " + templateName;
                        completionItem.insertText = " " + templateName;
                        items.push(completionItem);
                    }
                }
            }
            return items;
        } else {
            return [];
        }
    }

    isStartStructure(document: vscode.TextDocument,
        position: vscode.Position) {
            const lineTextBefore = document.lineAt(position.line).text.substring(0, position.character);
            if (util.isInFencedCodeBlock(document, position)
                    || !(/^\s*\[[^\]]*$/.test(lineTextBefore))
                    || position.line <= 0)
                return false;
            
            let previourLine = position.line - 1;
            while(previourLine >= 0) {
                const previousLineText = document.lineAt(previourLine).text.trim();
                if (previousLineText === '') {
                    previourLine--;
                    continue;
                } else if (previousLineText.startsWith('#')){
                    return true;
                } else {
                    return false;
                }
            }
            return false;
    }

    isInStructure(document: vscode.TextDocument,
        position: vscode.Position): { isInStruct:boolean; struType:string } {
            if (util.isInFencedCodeBlock(document, position)
                    || position.line <= 0)
                return {isInStruct:false, struType:undefined};

            let previourLine = position.line - 1;
            while(previourLine >= 0) {
                const previousLineText = document.lineAt(previourLine).text.trim();
                if (previousLineText.startsWith('#')
                || previousLineText === ']'
                || previousLineText.startsWith('-')
                || previousLineText.endsWith('```')) {
                    return {isInStruct:false, struType:undefined};
                } else if (previousLineText.startsWith('[')){
                    const structureType = previousLineText.substr(1).trim();
                    return {isInStruct:true, struType:structureType};
                }
                previourLine--;
            }
            return {isInStruct:false, struType:undefined};
    }

    AddToCompletion(options, items: vscode.CompletionItem[]) {
        for (const option in options) {
            const completionItem = new vscode.CompletionItem(" " + option);
            completionItem.detail = options[option].detail;
            completionItem.documentation = options[option].documentation;
            completionItem.insertText = options[option].insertText;
            items.push(completionItem);
        }
    }
}

const optionsMap = {
    options: { 
        '@strict': {
            detail: ' @strict = true',
            documentation: 'Developers who do not want to allow a null evaluated result can implement the strict option.', 
            insertText: ' @strict'},
        '@replaceNull': {
            detail: ' @replaceNull = ${path} is undefined',
            documentation: 'Developers can create delegates to replace null values in evaluated expressions by using the replaceNull option.',
            insertText: ' @replaceNull'},
        '@lineBreakStyle': {
            detail: ' @lineBreakStyle = markdown',
            documentation: 'Developers can set options for how the LG system renders line breaks using the lineBreakStyle option.',
            insertText: ' @lineBreakStyle'},
        '@Namespace': {
            detail: ' @Namespace = foo',
            documentation: 'You can register a namespace for the LG templates you want to export.',
            insertText: ' @Namespace'},
        '@Exports': {
            detail: ' @Exports = template1, template2',
            documentation: 'You can specify a list of LG templates to export.',
            insertText: ' @Exports'}
    },
    strictOptions : {
        'true': {
            detail: ' true',
            documentation: 'Null error will throw a friendly message.',
            insertText: ' true'
        },
        'false': {
            detail: ' false',
            documentation: 'A compatible result will be given.',
            insertText: ' false'
        }
    },
    replaceNullOptions: {
        '${path} is undefined':{
            detail: 'The null input in the path variable would be replaced with ${path} is undefined.',
            documentation: null,
            insertText: ' ${path} is undefined'
        }    
    },
    lineBreakStyleOptions: {
        'default': {
            detail: ' default',
            documentation: 'Line breaks in multiline text create normal line breaks.',
            insertText: ' default'
        },
        'markdown': {
            detail: ' markdown',
            documentation: 'Line breaks in multiline text will be automatically converted to two lines to create a newline.',
            insertText: ' markdown'
        }
    } 
}
