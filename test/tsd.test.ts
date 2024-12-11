import { describe, it, expect } from 'bun:test'
import { parseTsdHeader } from '../src/client'
/*prompt:  Create an internal Collaboration tool to Facilitate teamwork and communication among employees
api:       ~/BlazorDiffusion.ServiceModel/JobListings.cs
migration: ~/BlazorDiffusion/Migrations/Migration1009.cs
*/
describe('tsd tests', () => {
	it('does parse .d.ts header', () => {
        const header = parseTsdHeader([
            `/*prompt:  Create an internal Collaboration tool to Facilitate teamwork and communication among employees`,
            'api:       ~/BlazorDiffusion.ServiceModel/JobListings.cs',
            'migration: ~/BlazorDiffusion/Migrations/Migration1009.cs',
            '*/',
            'export enum MyEnum { A, B, C }',
        ].join('\n'))
        // console.log(header)
        expect(header!.prompt).toBe('Create an internal Collaboration tool to Facilitate teamwork and communication among employees')
        expect(header!.api).toBe('~/BlazorDiffusion.ServiceModel/JobListings.cs')
        expect(header!.migration).toBe('~/BlazorDiffusion/Migrations/Migration1009.cs')
    })
	it('does parse .d.ts header with multiple line prompts', () => {
        const header = parseTsdHeader([
            `/*prompt:  Create an internal Collaboration tool`,
            `to Facilitate teamwork and communication`,
            `among employees`,
            'api:       ~/BlazorDiffusion.ServiceModel/JobListings.cs',
            'migration: ~/BlazorDiffusion/Migrations/Migration1009.cs',
            '*/',
            'export enum MyEnum { A, B, C }',
        ].join('\n'))
        // console.log(header)
        expect(header!.prompt).toBe('Create an internal Collaboration tool\nto Facilitate teamwork and communication\namong employees')
        expect(header!.api).toBe('~/BlazorDiffusion.ServiceModel/JobListings.cs')
        expect(header!.migration).toBe('~/BlazorDiffusion/Migrations/Migration1009.cs')
    })
})
