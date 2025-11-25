import { describe, it } from 'node:test'
import assert from 'node:assert'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { convertDefinitionsToAst } from '../dist/client.js'
import { toTsd } from '../dist/tsd-gen.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const appJson = JSON.parse(readFileSync(join(__dirname, 'App.json'), 'utf-8'))

// return unique data types:
//cat test/db.json | jq '[.[].columns[].dataType] | unique'
// filter out tables:
// cat App_Data/db.json | jq '[.[] | select(.name | IN("CrudEvent", "__EFMigrationsHistory", "Migration") | not)]' > App_Data/db.json

describe('code gen tests', () => {
	it('does parse convert db.json to .d.ts', () => {
        const ast = convertDefinitionsToAst(appJson)
        const ts = toTsd(ast)
        // console.log(ts)
        assert.strictEqual(ts.trim(), `
export type Config = {
}

export class AspNetRoles {
  @primaryKey()
  id: string
  name?: string
  normalizedName?: string
  concurrencyStamp?: string
}

export class AspNetUsers {
  @primaryKey()
  id: string
  firstName?: string
  lastName?: string
  displayName?: string
  profileUrl?: string
  userName?: string
  normalizedUserName?: string
  email?: string
  normalizedEmail?: string
  emailConfirmed: boolean
  passwordHash?: string
  securityStamp?: string
  concurrencyStamp?: string
  phoneNumber?: string
  phoneNumberConfirmed: boolean
  twoFactorEnabled: boolean
  lockoutEnd?: Date
  lockoutEnabled: boolean
  accessFailedCount: long
}

export class AspNetRoleClaims {
  @autoIncrement()
  id: long
  roleId: string
  claimType?: string
  claimValue?: string
}

export class AspNetUserClaims {
  @autoIncrement()
  id: long
  userId: string
  claimType?: string
  claimValue?: string
}

export class AspNetUserLogins {
  @primaryKey()
  loginProvider: string
  @primaryKey()
  providerKey: string
  providerDisplayName?: string
  userId: string
}

export class AspNetUserRoles {
  @primaryKey()
  userId: string
  @primaryKey()
  roleId: string
}

export class AspNetUserTokens {
  @primaryKey()
  userId: string
  @primaryKey()
  loginProvider: string
  @primaryKey()
  name: string
  value?: string
}

export class Coupon {
  @primaryKey()
  id?: string
  description?: string
  discount: long
  expiryDate: Date
  createdDate: Date
  createdBy: string
  modifiedDate: Date
  modifiedBy: string
  deletedDate?: Date
  deletedBy?: string
}

export class Booking {
  @autoIncrement()
  id?: long
  name?: string
  roomType: string
  roomNumber: long
  bookingStartDate: Date
  bookingEndDate?: Date
  cost: long
  couponId?: string
  notes?: string
  cancelled?: long
  createdDate: Date
  createdBy: string
  modifiedDate: Date
  modifiedBy: string
  deletedDate?: Date
  deletedBy?: string
}`.trim())
        
    })
})
