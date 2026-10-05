import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import { activityAssets, BUNDLED_MANIFEST, resolveEditor, resolveLanguage } from "../src/asset-catalog";

// Runs inside the real TaxCode extension host with an isolated user profile.
// Presence is disabled in that profile so the test does not publish activity.
export async function run() {
    assert.equal(vscode.workspace.getConfiguration("cursorDiscord").get("enabled"), false);
    const extension = vscode.extensions.getExtension("Taxperia.cursor-presence");
    assert.ok(extension, "Development extension was not discovered");
    await extension.activate();
    assert.ok(extension.isActive);
    assert.equal(extension.extensionKind, vscode.ExtensionKind.UI);
    const editor = resolveEditor(BUNDLED_MANIFEST, vscode.env.appName, vscode.env.uriScheme);
    assert.equal(editor.embeddedKey, "taxcode");

    const document = await vscode.workspace.openTextDocument({ language: "typescript", content: "const taxcode = true;\n" });
    await vscode.window.showTextDocument(document);
    const language = resolveLanguage(BUNDLED_MANIFEST, document.fileName, document.languageId);
    assert.equal(language.name, "TypeScript");
    const assets = activityAssets(BUNDLED_MANIFEST, language, editor, "languageTextEditor", true);
    assert.ok(assets.large_image.includes("/editors/taxcode/default/typescript.png"));
    const commands = await vscode.commands.getCommands(true);
    for (const command of [
        "cursorDiscord.reconnect",
        "cursorDiscord.disconnect",
        "cursorDiscord.openSettings",
        "cursorDiscord.showMenu",
        "cursorDiscord.pause",
        "cursorDiscord.resume",
        "cursorDiscord.togglePrivacy",
    ]) {
        assert.ok(commands.includes(command), `Missing command: ${command}`);
    }
    await vscode.commands.executeCommand("cursorDiscord.disconnect");
    fs.writeFileSync(path.join(__dirname, "result.json"), JSON.stringify({
        appName: vscode.env.appName,
        uriScheme: vscode.env.uriScheme,
        version: vscode.version,
        active: extension.isActive,
        editor: editor.name,
        extensionKind: "ui",
        language: language.name,
        largeImage: assets.large_image,
    }, null, 2));
}
