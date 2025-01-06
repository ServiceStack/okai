import fs from 'fs'
import { describe, it, expect } from 'bun:test'
import { jobBoard } from './a-examples'
import { createAstFromAITypeScript } from '../src/ts-ast'
import { toMetadataTypes } from '../src/cs-ast'
import { UiMjsGroupGenerator, UiMjsIndexGenerator } from '../src/ui-mjs'

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

        expect(ui).toEqual(`export default {
    group: "Jobs",
    items: {
        Jobs: {
            type: 'Job',
            component: {
                template:\`<AutoQueryGrid :type="type"
                    selected-columns="id,companyId,title,description,type,category,status,postedAt" />\`,
            },
        },
        JobRequirements: {
            type: 'JobRequirement',
            component: {
                template:\`<AutoQueryGrid :type="type"
                    selected-columns="id,jobId,skill,experience,description" />\`,
            },
        },
        JobApplicants: {
            type: 'JobApplicant',
            component: {
                template:\`<AutoQueryGrid :type="type"
                    selected-columns="id,jobId,name,email,resume,coverLetter,appliedAt" />\`,
            },
        },
        Interviews: {
            type: 'Interview',
            component: {
                template:\`<AutoQueryGrid :type="type"
                    selected-columns="id,jobApplicantId,scheduledAt,conductedAt,result" />\`,
            },
        },
        Companies: {
            type: 'Company',
            component: {
                template:\`<AutoQueryGrid :type="type"
                    selected-columns="id,name,description,website" />\`,
            },
        },
    }
}`)
    })

    it('Does generate UI Index', () => {
        const indexGen = new UiMjsIndexGenerator()
        const files = ["index.mjs", "Bookings.mjs", "Jobs.mjs"]
        const index = indexGen.generate(files)
        expect(index).toEqual(`import Bookings from './Bookings.mjs'
import Jobs from './Jobs.mjs'
export {
    Bookings,
    Jobs,
}`)

    })
})