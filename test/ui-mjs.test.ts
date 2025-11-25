import fs from 'fs'
import { describe, it } from 'node:test'
import assert from 'node:assert'
import { jobBoard } from './a-examples.ts'
import { createAstFromAITypeScript } from '../dist/ts-ast.js'
import { toMetadataTypes } from '../dist/cs-ast.js'
import { UiMjsGroupGenerator, UiMjsIndexGenerator } from '../dist/ui-mjs.js'

/*prompt:  Create a Job Board
api:       ~/BlazorDiffusion.ServiceModel/JobListings.cs
migration: ~/BlazorDiffusion/Migrations/Migration1009.cs
ui:        ~/BlazorDiffusion/admin/section/JobListings.mjs
*/
describe('UI mjs tests', () => {
    it ('does generate Vue UI', () => {
        const ts = jobBoard
        const ast = createAstFromAITypeScript(ts)
        const csAst = toMetadataTypes(ast)

        const uiGen = new UiMjsGroupGenerator()
        const ui = uiGen.generate(csAst)
        // console.log(ui)

        assert.strictEqual(ui, `export default {
    group: "Jobs",
    items: {
        Companies: {
            type: 'Company',
            component: {
                template:\`
                <AutoQueryGrid :type="type"
                    selected-columns="id,name,description,website" />
                \`,
            },
        },
        Jobs: {
            type: 'Job',
            component: {
                template:\`
                <AutoQueryGrid :type="type"
                    selected-columns="id,companyId,title,description,type,category,status,postedAt" />
                \`,
            },
        },
        JobRequirements: {
            type: 'JobRequirement',
            component: {
                template:\`
                <AutoQueryGrid :type="type"
                    selected-columns="id,jobId,skill,experience,description" />
                \`,
            },
        },
        JobApplicants: {
            type: 'JobApplicant',
            component: {
                template:\`
                <AutoQueryGrid :type="type"
                    selected-columns="id,jobId,name,email,resume,coverLetter,appliedAt" />
                \`,
            },
        },
        Interviews: {
            type: 'Interview',
            component: {
                template:\`
                <AutoQueryGrid :type="type"
                    selected-columns="id,jobApplicantId,scheduledAt,conductedAt,result" />
                \`,
            },
        },
    }
}`)

    })

    it('Does generate UI Index', () => {
        const indexGen = new UiMjsIndexGenerator()
        const files = ["index.mjs", "Bookings.mjs", "Jobs.mjs"]
        const index = indexGen.generate(files)
        assert.strictEqual(index, `import Bookings from './Bookings.mjs'
import Jobs from './Jobs.mjs'
export {
    Bookings,
    Jobs,
}`)

    })
})