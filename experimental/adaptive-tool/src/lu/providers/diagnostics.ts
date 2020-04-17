/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as vscode from 'vscode';
import * as util from '../util';

const LUParser = require('@microsoft/bf-lu/lib/parser/lufile/luPaser').LUParser;

/**
 * Diagnostics are a way to indicate issues with the code.
 * @see https://code.visualstudio.com/api/language-extensions/programmatic-language-features#provide-diagnostics
 */
export function activate(context: vscode.ExtensionContext) {
  const collection: vscode.DiagnosticCollection = vscode.languages.createDiagnosticCollection('lg');
  if (vscode.window.activeTextEditor) {
    if (util.isLuFile(vscode.window.activeTextEditor.document.fileName)) {
      updateDiagnostics(vscode.window.activeTextEditor.document, collection);
    }
  }

  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(e => {
    if (e && util.isLuFile(e.document.fileName)) {
      updateDiagnostics(e.document, collection);
    }
  }));

  context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => {
    if (e && util.isLuFile(e.document.fileName)) {
      updateDiagnostics(e.document, collection);
    }
  }));

  context.subscriptions.push(vscode.workspace.onDidCloseTextDocument(doc => {
    if (doc && util.isLuFile(doc.fileName)) {
      collection.delete(doc.uri)
    }
  }));
}

function updateDiagnostics(document: vscode.TextDocument, collection: vscode.DiagnosticCollection): void {
  if (!util.isLuFile(document.fileName)) {
    collection.clear();
    return;
  }

  let luResource: any = LUParser.parse(document.getText());
  let diagnostics = luResource.Errors;
  let vscodeDiagnostics: vscode.Diagnostic[] = [];

  const severityConverter = {
    ERROR: 'Error',
    WARN: 'Warning'
  }

  diagnostics.forEach(u => {
    const diagItem = new vscode.Diagnostic(
      new vscode.Range(
        new vscode.Position(u.Range.Start.Line - 1, u.Range.Start.Character),
        new vscode.Position(u.Range.End.Line - 1, u.Range.End.Character)),
      u.Message,
      severityConverter[u.Severity]
    );
    vscodeDiagnostics.push(diagItem);
  });

  collection.set(document.uri, vscodeDiagnostics);
}
