declare global {
    export class AuditBase {
        createdDate: Date
        createdBy: string
        modifiedDate: Date
        modifiedBy: string
        deletedDate?: Date
        deletedBy?: string
    }

    export type TypeOf = `typeof(${string})`
    export type InputAttrOptions = { type?:string, value?:string, placeholder?:string, help?:string, label?:string, title?:string, size?:string, 
        pattern?:string, readOnly?:boolean, required?:boolean, disabled?:boolean, autocomplete?:string, autofocus?:string, 
        min?:string, max?:string, step?:string, minLength?:number, maxLength?:number, accept?:string, capture?:string, multiple?:boolean, 
        allowableValues?:string[], allowableValuesEnum?:TypeOf, options?:string, ignore?:boolean, evalAllowableValues?:string, evalAllowableEntries?:string, }
    export type ScriptValueOptions = { value?: any,  expression?: string, eval?: string,  noCache?: boolean }
    
    // A no-op class decorator factory that allows calling with parentheses
    function noOpClassDecorator() {
        return function <T extends { new(...args: any[]): {} }>(
            originalClass: T
        ) {
            // Return original class constructor without modifications
            return originalClass
        }
    }
    
    export const validateRequest = (validator:string) => noOpPropertyDecorator()
    const validateIsAuthenticated = noOpClassDecorator
    export const validateIsAdmin = noOpClassDecorator
    export const validateAuthSecret = noOpClassDecorator
    export const validateHasRole = (role:string) => noOpClassDecorator()
    export const validateHasRoles = (roles:string[]) => noOpClassDecorator()
    export const validateHasPermission = (permission:string) => noOpClassDecorator()
    export const validateHasPermissions = (permissions:string[]) => noOpClassDecorator()
    export const validateHasClaim = (claim:string) => noOpClassDecorator()
    export const validateHasScope = (scope:string) => noOpClassDecorator()
    export const validateApiKey = (scope?:string) => noOpClassDecorator()
    
    export const schema = (schema:string) => noOpClassDecorator()
    export const compositeKey = (columns:string[]) => noOpClassDecorator()
    export const compositeIndex = (unique:boolean, columns:string[]) => noOpClassDecorator()
    export const preCreateTable = (sql:string) => noOpClassDecorator()
    export const preDropTable = (sql:string) => noOpClassDecorator()
    export const postCreateTable = (sql:string) => noOpClassDecorator()
    export const postDropTable = (sql:string) => noOpClassDecorator()
    
    export const api = (description:string, opt?:{ bodyParameter?:number, requestContentType?:string, isRequired?:boolean }) => noOpClassDecorator()
    export const apiResponse = (statusCode:number, description:string, opt?:{ isDefaultResponse?:boolean, responseType?:TypeOf }) => noOpClassDecorator()
    
    export const dataContract = noOpClassDecorator
    export const route = (path:string, opt?:{ summary?:string, notes?:string, verbs?:string, priority?:number, matches?:string, }) => noOpClassDecorator()
    export const icon = (opt?:{ svg?:string, uri?:string, alt?:string, cls?:string, }) => noOpClassDecorator()
    export const field = (opt?:InputAttrOptions & { name?:string, fieldCss?:string, inputCss?:string, labelCss?:string, }) => noOpClassDecorator()
    export const tag = (name:string) => noOpClassDecorator()
    export const worker = (name:string) => noOpClassDecorator()
    export const notes = (notes:string) => noOpClassDecorator()
    export const namedConnection = (name:string) => noOpClassDecorator()
    
    export enum QueryTerm { Default = 0, And = 1, Or = 2, Ensure = 3, }
    export const queryDb = (defaultTerm:QueryTerm) => noOpClassDecorator()
    export const queryData = (defaultTerm:QueryTerm) => noOpClassDecorator()
    export const autoFilter = (term:QueryTerm, field?:string, opt?:{ operand?:string, template?:string, valueFormat:string }) => noOpClassDecorator()
    export const autoPopulate = (field?:string, opt?:ScriptValueOptions) => noOpClassDecorator()
    
    export const SqlTemplate = {
        IsNull:              "{Field} IS NULL",
        IsNotNull:           "{Field} IS NOT NULL",
        GreaterThanOrEqual:  "{Field} >= {Value}",
        GreaterThan:         "{Field} > {Value}",
        LessThan:            "{Field} < {Value}",
        LessThanOrEqual:     "{Field} <= {Value}",
        NotEqual:            "{Field} <> {Value}",
        CaseSensitiveLike:   "{Field} LIKE {Value}",
        CaseInsensitiveLike: "UPPER({Field}) LIKE UPPER({Value})",
    }
    
    function noOpClassOrPropertyDecorator(config?: any) {
        return function(
          target: any, 
          context: ClassDecoratorContext | ClassFieldDecoratorContext
        ) {
          // Simply return undefined to allow default property initialization
          return undefined
        }
    }
    
    export const alias = (table:string) => noOpClassOrPropertyDecorator()
    export const meta = (name:string,value:string) => noOpClassOrPropertyDecorator()
    export const priority = (value:string) => noOpClassOrPropertyDecorator()
    
    export const flags = noOpClassOrPropertyDecorator
    export const enumMember = (opt:{ value:string }) => noOpClassOrPropertyDecorator()
    
    const RequestAttrs = {
        api,
        apiResponse,
        validateRequest,
        validateIsAuthenticated,
        validateIsAdmin,
        validateAuthSecret,
        validateHasRole,
        validateHasRoles,
        validateHasPermission,
        validateHasPermissions,
        validateHasClaim,
        validateHasScope,
        validateApiKey,
    
        queryDb,
        queryData,
        autoFilter,
        autoPopulate,
    
        route,
        field,
        tag,
        notes,
    }
    
    const TypeAttrs = {
        meta,
        dataContract,
    }
    
    const DataModelAttrs = {
        schema,
        compositeKey,
        preCreateTable,
        preDropTable,
        postCreateTable,
        postDropTable,
    
        namedConnection,
        alias,
        icon,
    }
    
    // A no-op property decorator factory
    function noOpPropertyDecorator(config?: any) {
        return function(
          target: any, 
          context: ClassFieldDecoratorContext
        ) {
          // Simply return undefined to allow default property initialization
          return undefined
        }
    }
    export const validate = (validator:string) => noOpPropertyDecorator()
    export const validateNull = noOpPropertyDecorator
    export const validateEmpty = noOpPropertyDecorator
    export const validateEmail = noOpPropertyDecorator
    export const validateNotNull = noOpPropertyDecorator
    export const validateNotEmpty = noOpPropertyDecorator
    export const validateCreditCard = noOpPropertyDecorator
    export const validateLength = (min:number, max:number) => noOpPropertyDecorator()
    export const validateExactLength = (length:number) => noOpPropertyDecorator()
    export const validateMinimumLength = (min:number) => noOpPropertyDecorator()
    export const validateMaximumLength = (max:number) => noOpPropertyDecorator()
    export const validateLessThanLength = (value:number) => noOpPropertyDecorator()
    export const validateLessThanOrEqual = (value:number) => noOpPropertyDecorator()
    export const validateGreaterThanLength = (value:number) => noOpPropertyDecorator()
    export const validateGreaterThanOrEqual = (value:number) => noOpPropertyDecorator()
    export const validateScalePrecision = (scale:number, precision:number) => noOpPropertyDecorator()
    export const validateRegularExpression = (pattern:string) => noOpPropertyDecorator()
    export const validateEqualExpression = (value:string|number|boolean) => noOpPropertyDecorator()
    export const validateNotEqualExpression = (value:string|number|boolean) => noOpPropertyDecorator()
    export const validateInclusiveBetween = (from:string|number,to:string|number) => noOpPropertyDecorator()
    export const validateExclusiveBetween = (from:string|number,to:string|number) => noOpPropertyDecorator()
    
    export const allowReset = noOpPropertyDecorator
    export const denyReset = noOpPropertyDecorator
    
    export const primaryKey = noOpPropertyDecorator
    export const autoId = noOpPropertyDecorator
    export const autoIncrement = noOpPropertyDecorator
    export const belongTo = (BelongToTableType:TypeOf) => noOpPropertyDecorator()
    export const index = (opt?:{ name?:string, unique?:boolean, clustered?:boolean, nonClustered?:boolean, }) => noOpPropertyDecorator()
    export const compute = noOpPropertyDecorator
    export const computed = noOpPropertyDecorator
    export const persisted = noOpPropertyDecorator
    export const uniqueConstraint = (columns:string[]) => noOpPropertyDecorator()
    export const addColumn = noOpPropertyDecorator
    export const removeColumn = noOpPropertyDecorator
    export const checkConstraint = (constraint:string) => noOpPropertyDecorator()
    export const customField = (sql:string, order?:number) => noOpPropertyDecorator()
    export const customSelect = (sql:string) => noOpPropertyDecorator()
    export const customInsert = (sql:string) => noOpPropertyDecorator()
    export const customUpdate = (sql:string) => noOpPropertyDecorator()
    export const decimalLength = (precision:number, scale?:number) => noOpPropertyDecorator()
    export const Default = (value:string|number|boolean) => noOpPropertyDecorator()
    export const description = (description:string) => noOpPropertyDecorator()
    export const enumAsInt = noOpPropertyDecorator
    export const excludeMetadata = noOpPropertyDecorator
    export const excludeFromDescription = noOpPropertyDecorator
    export const explicitAutoQuery = noOpPropertyDecorator
    export type foreignKeyBehavior = "NO ACTION"|"RESTRICT"|"SET NULL"|"SET DEFAULT"|"CASCADE"
    export const foreignKey = (type:string, opt?:{ onDelete?:foreignKeyBehavior, onUpdate?:foreignKeyBehavior, foreignKeyName?:string }) => noOpPropertyDecorator()
    export const ignore = noOpPropertyDecorator
    export const ignoreOnUpdate = noOpPropertyDecorator
    export const ignoreOnInsert = noOpPropertyDecorator
    export const ignoreDataMember = noOpPropertyDecorator
    export const reference = noOpPropertyDecorator
    export const referenceField = (model:TypeOf, id?:string, field?:string) => noOpPropertyDecorator()
    export const references = (type:TypeOf) => noOpPropertyDecorator()
    export const required = noOpPropertyDecorator
    export const returnOnInsert = noOpPropertyDecorator
    export const rowVersion = noOpPropertyDecorator
    export const unique = noOpPropertyDecorator
    
    export enum ValueStyle { Single, Multiple, List, }
    export const queryDbField = (opt?:{ term:QueryTerm, operand?:string, template?:string, field?:string, valueFormat?:string, valueStyle?:ValueStyle, valueArity?:number }) => noOpPropertyDecorator()
    export const queryDataField = (opt?:{ term:QueryTerm, condition?:string, field?:string }) => noOpPropertyDecorator()
    
    export enum AutoUpdateStyle { Always, NonDefaults }
    export const autoUpdate = (style:AutoUpdateStyle) => noOpPropertyDecorator()
    export const autoDefault = (opt:ScriptValueOptions) => noOpPropertyDecorator()
    export const autoMap = (to:string) => noOpPropertyDecorator()
    export const autoIgnore = noOpPropertyDecorator
    export const autoApply = (name:string, args?:string[]) => noOpPropertyDecorator()
    
    export const apiMember = (opt?:{ name?:string, verb?:string, parameterType?:string, description?:string, dataType?:string,
        format?:string, isRequired?:boolean, isOptional?:boolean, allowMultiple?:boolean, route?:string, excludeInSchema?:boolean
    }) => noOpPropertyDecorator()
    export const apiAllowableValues = (name:string, opt?:{ type?:"RANGE"|"LIST", min?:number, max?:number, values?:string[] }) => noOpPropertyDecorator()
    
    export const dataMember = (opt?:{ name?:string, order?:number, isRequired?:boolean }) => noOpPropertyDecorator()
    export const input = (opt?:InputAttrOptions) => noOpPropertyDecorator()
    export const fieldCss = (opt?:{ field?:string, input?:string, label?:string, }) => noOpPropertyDecorator()
    export const explorerCss = (opt?:{ form?:string, fieldset?:string, field?:string, }) => noOpPropertyDecorator()
    export const locodeCss = (opt?:{ form?:string, fieldset?:string, field?:string, }) => noOpPropertyDecorator()
    export const uploadTo = (location:string) => noOpPropertyDecorator()
    export const ref = (opt?:{ modelType?:TypeOf, model?:string, refId?:string, refLabel?:string, selfId?:string, queryType?:TypeOf, none?:boolean, }) => noOpPropertyDecorator()
    export type FormatMethods = "currency"|"bytes"|"icon"|"iconRounded"|"attachment"|"link"|"linkMailTo"|"linkTel"|"enumFlags"|"hidden"
    export const format = (method:FormatMethods, opt?:{ options?:string, locale?:string }) => noOpPropertyDecorator()
    
    export enum IntlFormat { Number, DateTime, RelativeTime }
    export enum NumberStyle { Undefined=0, Decimal, Currency, Percent, Unit, }
    export enum DateStyle { Undefined=0, Full, Long, Medium, Short, }
    export enum TimeStyle { Undefined=0, Full, Long, Medium, Short, }
    export enum Numeric { Undefined=0, Always, Auto, }
    
    export enum DatePart { Undefined=0, Numeric, Digits2, }
    export enum DateMonth { Undefined=0, Numeric, Digits2, Narrow, Short, Long, }
    export enum DateText { Undefined=0, Narrow, Short, Long }
    
    export enum CurrencyDisplay { Undefined=0, Symbol, NarrowSymbol, Code, Name, }
    export enum CurrencySign { Undefined=0, Accounting, Standard, }
    export enum SignDisplay { Undefined=0, Always, Auto, ExceptZero, Negative, Never, }
    export enum RoundingMode { Undefined=0, Ceil, Floor, Expand, Trunc, HalfCeil, HalfFloor, HalfExpand, HalfTrunc, HalfEven, }
    
    export enum UnitDisplay { Undefined=0, Long, Short, Narrow }
    export enum Notation { Undefined=0, Standard, Scientific, Engineering, Compact, }
    
    export type IntlOptions = { locale?:string, options?:string, number?:NumberStyle, date?:DateStyle, time?:TimeStyle, numeric?:Numeric,
        currency?:string, currencyDisplay?:CurrencyDisplay, currencySign?:CurrencySign, signDisplay?:SignDisplay, roundingMode?:RoundingMode,
        unit?:string, unitDisplay?:UnitDisplay, notation?:Notation,
        minimumIntegerDigits?:number, minimumFractionDigits?:number, maximumFractionDigits?:number, minimumSignificantDigits?:number, maximumSignificantDigits?:number, fractionalSecondDigits?:number, 
        weekday?:DateText, era?:DateText, year?:DatePart, month?:DateMonth, day?:DatePart, hour?:DatePart, minute?:DatePart, second?:DatePart, 
        timeZoneName?:DateText, timeZone?:string, hour12?:boolean
    }
    
    export const intl = (type:IntlFormat, opt?:IntlOptions) => noOpPropertyDecorator()
    export const intlNumber = (number?:NumberStyle) => noOpPropertyDecorator()
    export const intlDateTime = (date?:DateStyle, time?:TimeStyle) => noOpPropertyDecorator()
    export const intlRelativeTime = (numeric?:Numeric) => noOpPropertyDecorator()

    const RequestPropAttrs = {
        validate,
        validateNull,
        validateEmpty,
        validateEmail,
        validateNotNull,
        validateNotEmpty,
        validateCreditCard,
        validateLength,
        validateExactLength,
        validateMinimumLength,
        validateMaximumLength,
        validateLessThanLength,
        validateLessThanOrEqual,
        validateGreaterThanLength,
        validateGreaterThanOrEqual,
        validateScalePrecision,
        validateRegularExpression,
        validateEqualExpression,
        validateNotEqualExpression,
        validateInclusiveBetween,
        validateExclusiveBetween,
        allowReset,
        denyReset,
    
        queryDbField,
        queryDataField,
        autoUpdate,
        autoDefault,
        autoMap,
        autoIgnore,
        autoApply,

        apiMember,
        apiAllowableValues,
        dataMember,
        input,
        fieldCss,
        uploadTo,
    }
    
    const DataModelPropAttrs = {
        alias,
        meta,
        priority,
    
        primaryKey,
        autoId,
        autoIncrement,
        index,
        compute,
        computed,
        persisted,
        uniqueConstraint,
        addColumn,
        removeColumn,
        belongTo,
        checkConstraint,
        customField,
        customSelect,
        customInsert,
        customUpdate,
        decimalLength,
        Default,
        description,
        enumAsInt,
        excludeMetadata,
        excludeFromDescription,
        explicitAutoQuery,
        foreignKey,
        ignore,
        ignoreOnUpdate,
        ignoreOnInsert,
        ignoreDataMember,
        reference,
        referenceField,
        references,
        required,
        returnOnInsert,
        rowVersion,
        unique,
    
        dataMember,
        ref,
        format,
        intl,
        intlNumber,
        intlDateTime,
        intlRelativeTime,
    }
    
    export const All = {
        ...RequestAttrs,
        ...TypeAttrs,
        ...RequestPropAttrs,
        ...DataModelAttrs,
    }
    export const Read = {
        ...All,
    }
    export const Write = {
        ...All,
    }
    export const Create = {
        ...All,
    }
    export const Update = {
        ...All,
    }
    export const Delete = {
        ...All,
    }
}

export {}