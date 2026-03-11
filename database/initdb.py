import sqlite3

con = sqlite3.connect("hr.db")
cur = con.cursor()

cur.execute("""CREATE TABLE Workspace (
               WorkspaceID INTEGER NOT NULL,
               PRIMARY KEY (WorkspaceID)
            );""")

cur.execute("""CREATE TABLE Month_Work_Days (
               WorkspaceID INTEGER PRIMARY KEY,
               jan_work int NOT NULL,
               jan_hypo int NOT NULL,
               feb_work int NOT NULL,
               feb_hypo int NOT NULL,
               mar_work int NOT NULL,
               mar_hypo int NOT NULL,
               apr_work int NOT NULL,
               apr_hypo int NOT NULL,
               may_work int NOT NULL,
               may_hypo int NOT NULL,
               jun_work int NOT NULL,
               jun_hypo int NOT NULL,
               jul_work int NOT NULL,
               jul_hypo int NOT NULL,
               aug_work int NOT NULL,
               aug_hypo int NOT NULL,
               sep_work int NOT NULL,
               sep_hypo int NOT NULL,
               oct_work int NOT NULL,
               oct_hypo int NOT NULL,
               nov_work int NOT NULL,
               nov_hypo int NOT NULL,
               dec_work int NOT NULL,
               dec_hypo int NOT NULL,
               FOREIGN KEY (WorkspaceID) REFERENCES Workspace(WorkspaceID)
            );""")

cur.execute("""CREATE TABLE EmployeeSpecialisms (
               ID INT AUTO_INCREMENT, 
               EmployeeID INT ,
               Specialism VARCHAR(20),
               PRIMARY KEY (ID, EmployeeID)
               FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID)
            );""")


cur.execute("""CREATE TABLE Employee (
               EmployeeID INTEGER PRIMARY KEY,
               Name VARCHAR(40) NOT NULL,
               ExcludeFromAI BOOL NOT NULL,
               WorkspaceID INT NOT NULL,
               FOREIGN KEY (WorkspaceID) REFERENCES Workspace(WorkspaceID)
               );""")

cur.execute("""CREATE TABLE Job (
               JobCode VARCHAR(20) PRIMARY KEY,
               ResourceBu varchar(20),
               Description VARCHAR(1000),
               BusinessUnit VARCHAR(20),
               JobOrigin varchar(20),
               ReplyEntity varchar(20),
               customer varchar(20),
               t_code varchar(6),
               TimeBudget INT,
               CurrencySymbol VARCHAR(1),
               MonetaryBudget DECIMAL,
               StartDate DATETIME, 
               FinishDate DATETIME,
               WorkspaceID INTEGER NOT NULL,
               FOREIGN KEY (WorkspaceID) REFERENCES Workspace(WorkspaceID)
               );""")

cur.execute("""CREATE TABLE ForecastEntry (
               EmployeeID INT NOT NULL,
               JobCode VARCHAR(20) NOT NULL,
               Cost DECIMAL,
               Days FLOAT,
               WorkspaceID INT NOT NULL,
               PRIMARY KEY (EmployeeID, JobCode),
               FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
               FOREIGN KEY (JobCode) REFERENCES Job(JobCode),
               FOREIGN KEY (WorkspaceID) REFERENCES Workspace(WorkspaceID)
               );""")
