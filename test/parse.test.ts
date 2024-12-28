import { describe, it, expect } from 'bun:test'
import { parseUserType, parseUserDtoType } from '../src/info'

describe('parse tests', () => {

    it ('does parse IdentityUser', () => {
        const cs = `
// Add profile data for application users by adding properties to the ApplicationUser class
public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? ProfileUrl { get; set; }
}
`
        const userInfo = parseUserType(cs)
        expect(userInfo?.userType).toBe('ApplicationUser')
        expect(userInfo?.userIdType).toBe(null)
    })

    it ('does parse IdentityUser<int>', () => {
        const cs = `
// Add profile data for application users by adding properties to the ApplicationUser class
public class ApplicationUser : IdentityUser<int>
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? ProfileUrl { get; set; }
}
`
        const userInfo = parseUserType(cs)
        expect(userInfo?.userType).toBe('ApplicationUser')
        expect(userInfo?.userIdType).toBe('int')
    })

    it ('does parse User DTO', () => {
        const cs = `
/// <summary>
/// Public User DTO
/// </summary>
[Alias("AspNetUsers")]
public class User
{
    public string Id { get; set; }
    public string UserName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? DisplayName { get; set; }
    public string? ProfileUrl { get; set; }
}`
        const dto = parseUserDtoType(cs)

        // console.log(dto)
        expect(dto?.userType).toBe('User')
        expect(dto?.userIdType).toBe('string')
        expect(dto?.userLabel).toBe('DisplayName')
    })

    it ('does parse User DTO without DisplayName', () => {
        const cs = `
[Alias("AspNetUsers")]
public class User
{
    public string Id { get; set; }
    public string UserName { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ProfileUrl { get; set; }
}`
        const dto = parseUserDtoType(cs)

        // console.log(dto)
        expect(dto?.userType).toBe('User')
        expect(dto?.userIdType).toBe('string')
        expect(dto?.userLabel).toBe('FirstName')
    })
})
