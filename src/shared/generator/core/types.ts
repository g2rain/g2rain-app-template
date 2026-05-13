export interface TableColumn {
    name: string;
    camelName: string;
    type: string;
    nullable: boolean;
    comment: string;
    isBaseField: boolean;
    isDeleteFlag: boolean;
}

export interface TableInfo {
    name: string;
    camelName: string;
    routePath: string;
    routeName: string;
    /** 表级 COMMENT（来自 `) ENGINE=... COMMENT='...'`），无则为 "" */
    tableComment: string;
    title: string;
    columns: TableColumn[];
    baseColumns: TableColumn[];
    businessColumns: TableColumn[];
}
