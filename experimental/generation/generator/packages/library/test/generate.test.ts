/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// tslint:disable:no-console
// tslint:disable:no-object-literal-type-assertion

import * as fs from 'fs-extra'
import 'mocha'
import * as os from 'os'
import * as ppath from 'path'
import * as ft from '../src/schema'
import * as gen from '../src/dialogGenerator'
import * as ps from '../src/processSchemas'
import * as assert from 'assert'

function feedback(type: gen.FeedbackType, msg: string) {
    if (type !== gen.FeedbackType.debug) {
        console.log(`${type}: ${msg}`)
    }
}

describe('dialog:generate library', async () => {
    let output = ppath.join(os.tmpdir(), 'sandwich.out')
    let schemaPath = 'test/forms/sandwich.schema'
    let badSchema = 'test/forms/bad-schema.schema'
    let notObject = 'test/forms/not-object.schema'
    let override = 'test/templates/override'

    beforeEach(async () => {
        await fs.remove(output)
    })

    it('Hash text', async () => {
        let lu = `> LU File${os.EOL}# Intent${os.EOL}- This is an .lu file`
        let lufile = ppath.join(os.tmpdir(), 'test.lu')

        await gen.writeFile(lufile, lu, feedback)
        assert(await gen.isUnchanged(lufile))

        lu = await fs.readFile(lufile, 'utf-8')
        lu += `${os.EOL}- another line`
        await fs.writeFile(lufile, lu)
        assert(!await gen.isUnchanged(lufile))

        await gen.writeFile(lufile, lu, feedback, true)
        assert(!await gen.isUnchanged(lufile))

        await gen.writeFile(lufile, lu, feedback)
        assert(await gen.isUnchanged(lufile))
        lu = await fs.readFile(lufile, 'utf-8')
        assert((lu.match(/Generator:/g) || []).length === 1)
    })

    it('Hash JSON', async () => {
        let dialog = { $comment: 'this is a .dialog file' }
        let dialogFile = ppath.join(os.tmpdir(), 'test.dialog')

        await gen.writeFile(dialogFile, JSON.stringify(dialog), feedback)
        assert(await gen.isUnchanged(dialogFile))

        // Test json hashing
        dialog = JSON.parse(await fs.readFile(dialogFile, 'utf-8'))
        dialog['foo'] = 3
        await fs.writeFile(dialogFile, JSON.stringify(dialog))
        assert(!await gen.isUnchanged(dialogFile))

        await gen.writeFile(dialogFile, JSON.stringify(dialog), feedback)
        assert(await gen.isUnchanged(dialogFile))
    })

    it('Generation with override', async () => {
        try {
            console.log('\n\nGeneration with override')
            await gen.generate(schemaPath, undefined, output, undefined, ['en-us'], [override, 'standard'], false, false, undefined, feedback)
            let lg = await fs.readFile(ppath.join(output, 'en-us/bread', 'sandwich-Bread.en-us.lg'))
            assert.ok(lg.toString().includes('What kind of bread?'), 'Did not override locale generated file')
            let dialog = await fs.readFile(ppath.join(output, 'bread/sandwich-Bread-missing.dialog'))
            assert.ok(!dialog.toString().includes('priority'), 'Did not override top-level file')
        } catch (e) {
            assert.fail(e.message)
        }
    })

    it('Singleton', async () => {
        try {
            console.log('\n\nGeneration')
            await gen.generate(schemaPath, undefined, output, undefined, ['en-us'], undefined, false, false, true, feedback)
            assert.ok(!await fs.pathExists(ppath.join(output, 'Bread')), 'Did not generate singleton')
        } catch (e) {
            assert.fail(e.message)
        }
    })

    it('Not object type', async () => {
        try {
            await ft.Schema.readSchema(notObject)
            assert.fail('Did not detect bad schema')
        } catch (e) {
            assert(e.message.includes('must be of type object'), 'Missing type object')
        }
    })

    it('Illegal schema', async () => {
        try {
            await ft.Schema.readSchema(badSchema)
            assert.fail('Did not detect bad schema')
        } catch (e) {
            assert(e.message.includes('is not a valid JSON Schema'), 'Missing valid JSON schema')
        }
    })

    it('Schema discovery', async() => {
        try {
            let schemas = await ps.schemas()
            assert.equal(Object.keys(schemas).length, 10, 'Wrong number of schemas discovered')
            let global = 0
            let property = 0
            for (let [_, schema] of Object.entries(schemas)) {
                if (ps.isGlobalSchema(schema)) {
                    ++global
                } else {
                    ++property
                }
            }
            assert.equal(global, 3, 'Wrong number of global schemas')
            assert.equal(property, 7, 'Wrong number of property schemas')
        } catch (e) {
            assert.fail(e.message)
        }
    })

    it('Expand simple property definition', async () => {
        try {
            let schema = {
                type: 'number'
            }
            let expansion = await gen.expandPropertyDefinition('simple', schema)
            assert(expansion.$entities, 'Did not generate $entities')
            assert.equal(expansion.$entities.length, 2, 'Wrong number of entities')
            assert.equal(expansion.$entities[0], 'number:simple', 'Missing role')
        } catch (e) {
            assert.fail(e.message)
        }
    })

    it('Expand $ref property definition', async () => {
        try {
            let schema = {
                $ref: "template:dimension.schema"
            }
            let expansion = await gen.expandPropertyDefinition('ref', schema)
            assert(expansion.$entities, 'Did not generate $entities')
            assert.equal(expansion.$entities.length, 2, 'Wrong number of entities')
            assert.equal(expansion.$entities[0], 'dimension:ref', 'Missing role')
        } catch (e) {
            assert.fail(e.message)
        }
    })
})
