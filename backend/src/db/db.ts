import Database, { Database as DatabaseType } from "better-sqlite3";

let db: DatabaseType;

if (process.env.NODE_ENV !== 'test') {
    db = new Database("/database/hr.db");
} else {
    db = new Database(':memory:');

    db.exec(`
        CREATE TABLE Workspace (
            WorkspaceID INTEGER PRIMARY KEY
        );
    `);

    db.exec(`
        CREATE TABLE Month_Work_Days (
            WorkspaceID INTEGER PRIMARY KEY,
            jan_work INT NOT NULL,
            jan_hypo INT NOT NULL,
            feb_work INT NOT NULL,
            feb_hypo INT NOT NULL,
            mar_work INT NOT NULL,
            mar_hypo INT NOT NULL,
            apr_work INT NOT NULL,
            apr_hypo INT NOT NULL,
            may_work INT NOT NULL,
            may_hypo INT NOT NULL,
            jun_work INT NOT NULL,
            jun_hypo INT NOT NULL,
            jul_work INT NOT NULL,
            jul_hypo INT NOT NULL,
            aug_work INT NOT NULL,
            aug_hypo INT NOT NULL,
            sep_work INT NOT NULL,
            sep_hypo INT NOT NULL,
            oct_work INT NOT NULL,
            oct_hypo INT NOT NULL,
            nov_work INT NOT NULL,
            nov_hypo INT NOT NULL,
            dec_work INT NOT NULL,
            dec_hypo INT NOT NULL,
            FOREIGN KEY (WorkspaceID) REFERENCES Workspace(WorkspaceID)
        );
    `);

    db.exec(`
        CREATE TABLE Employee (
            EmployeeID INTEGER PRIMARY KEY,
            Name VARCHAR(40) NOT NULL,
            ExcludeFromAI BOOL NOT NULL,
            WorkspaceID INT NOT NULL,
            FOREIGN KEY (WorkspaceID) REFERENCES Workspace(WorkspaceID)
        );
    `);

    db.exec(`
        CREATE TABLE EmployeeSpecialisms (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            EmployeeID INT,
            Specialism VARCHAR(20),
            FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
        );
    `);

    db.exec(`
        CREATE TABLE Job (
            JobCode VARCHAR(20) PRIMARY KEY,
            ResourceBu VARCHAR(20),
            Description VARCHAR(1000),
            BusinessUnit VARCHAR(20),
            JobOrigin VARCHAR(20),
            ReplyEntity VARCHAR(20),
            customer VARCHAR(20),
            t_code VARCHAR(6),
            TimeBudget INT,
            CurrencySymbol VARCHAR(1),
            MonetaryBudget DECIMAL,
            Cost DECIMAL,
            StartDate DATETIME,
            FinishDate DATETIME,
            WorkspaceID INTEGER NOT NULL,
            FOREIGN KEY (WorkspaceID) REFERENCES Workspace(WorkspaceID)
        );
    `);

    db.exec(`
        CREATE TABLE ForecastEntry (
            EmployeeID INT NOT NULL,
            JobCode VARCHAR(20) NOT NULL,
            Cost DECIMAL,
            Days FLOAT,
            WorkspaceID INT NOT NULL,
            Days_allocated_jan FLOAT,
            Days_allocated_feb FLOAT,
            Days_allocated_mar FLOAT,
            Days_allocated_apr FLOAT,
            Days_allocated_may FLOAT,
            Days_allocated_jun FLOAT,
            Days_allocated_jul FLOAT,
            Days_allocated_aug FLOAT,
            Days_allocated_sep FLOAT,
            Days_allocated_oct FLOAT,
            Days_allocated_nov FLOAT,
            Days_allocated_dec FLOAT,
            PRIMARY KEY (EmployeeID, JobCode),
            FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
            FOREIGN KEY (JobCode) REFERENCES Job(JobCode),
            FOREIGN KEY (WorkspaceID) REFERENCES Workspace(WorkspaceID)
        );
    `);
}

export default db;