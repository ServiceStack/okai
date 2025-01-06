import { MetadataTypes } from "./types"
import { getGroupName, plural, toCamelCase } from "./utils"

/*
export default {
    group: "Bookings",
    items: {
        Bookings: {
            type: 'Booking',
            component: {
                template:`<AutoQueryGrid :type="type" 
                    selected-columns="id,name,roomType,roomNumber,bookingStartDate,bookingEndDate,cost,couponId,discount" />`,
            },
        },
        Coupons: {
            type: 'Coupon',
            component: {
                template:`<AutoQueryGrid :type="type" 
                    selected-columns="id,name,description,discount,expiryDate" />`,
            },
        },
    },
}
*/
export class UiMjsGroupGenerator {
    generate(ast:MetadataTypes, groupLabel?:string) {
        if (!groupLabel) {
            const groupName = getGroupName(ast)
            groupLabel = plural(groupName)
        }
        const sb = [
            `export default {`,
            `    group: "${groupLabel}",`,
            `    items: {`,
                ...ast.types.filter(x => !x.isEnum && !x.isInterface).map(x => {
                    return [
                        `        ${plural(x.name)}: {`,
                        `            type: '${x.name}',`,
                        `            component: {`,
                        `                template:\`<AutoQueryGrid :type="type"`,
                        `                    selected-columns="${x.properties.map(x => toCamelCase(x.name)).join(',')}" />\`,`,
                        `            },`,
                        `        },`,
                    ].join('\n')
                }),
            `    }`,
            `}`,
        ]

        const src = sb.join('\n')
        return src
    }
}

/*
import Bookings from './Bookings.mjs'
export {
    Bookings,
}  
*/
export class UiMjsIndexGenerator {
    generate(files:string[]) {
        const imports = []
        const exports = ['export {']
        files.filter(x => x != 'index.mjs').forEach(x => {
            const name = x.replace('.mjs', '')
            imports.push(`import ${name} from './${name}.mjs'`)
            exports.push(`    ${name},`)
        })
        exports.push('}')

        const src = imports.join('\n') + '\n' + exports.join('\n')
        return src
    }
}
