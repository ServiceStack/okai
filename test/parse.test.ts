import { describe, it } from 'node:test'
import assert from 'node:assert'
import { parseUserType, parseUserDtoType } from '../dist/info.js'

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
        assert.strictEqual(userInfo?.userType, 'ApplicationUser')
        assert.strictEqual(userInfo?.userIdType, null)
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
        assert.strictEqual(userInfo?.userType, 'ApplicationUser')
        assert.strictEqual(userInfo?.userIdType, 'int')
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
        assert.strictEqual(dto?.userType, 'User')
        assert.strictEqual(dto?.userIdType, 'string')
        assert.strictEqual(dto?.userLabel, 'DisplayName')
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
        assert.strictEqual(dto?.userType, 'User')
        assert.strictEqual(dto?.userIdType, 'string')
        assert.strictEqual(dto?.userLabel, 'FirstName')
    })
})
