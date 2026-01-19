export default interface parsedExcelInfo {
    name: string | undefined, 
    resource_bu: string | undefined, 
    customer: string | undefined, 
    unknown: string | undefined, 
    jobcode: string | undefined, 
    description: string | undefined, 
    resource_allocation: (string | undefined)[]
}