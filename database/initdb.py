import sqlite3

con = sqlite3.connect("hr.db")
cur = con.cursor()

cur.execute("""CREATE TABLE Workspace (
               workspaceID INTEGER NOT NULL,
               PRIMARY KEY (workspaceID)
            );""")

cur.execute("""CREATE TABLE EmployeeSpecialisms (
               Id INT PRIMARY KEY, 
               Specialism VARCHAR(20)
            );""")

cur.execute("""CREATE TABLE Employee (
               EmployeeID INTEGER PRIMARY KEY AUTOINCREMENT,
               Name VARCHAR(40) NOT NULL,
               Specialism INT REFERENCES EmployeeSpecialisms(Id) ON DELETE CASCADE,  
               Exclude_from_AI BOOL NOT NULL,
               workspaceID INT NOT NULL,
               FOREIGN KEY (workspaceID) REFERENCES Workspace(workspaceID)
               );""")

cur.execute("""CREATE TABLE Job (
               JobCode VARCHAR(20) PRIMARY KEY,
               Description VARCHAR(1000) NOT NULL,
               BusinessUnit VARCHAR(20) NOT NULL,
               TimeBudget INT,
               CurrencySymbol VARCHAR(1),
               MonetaryBudget DECIMAL,
               StartDate DATETIME NOT NULL,
               FinishDate DATETIME,
               workspaceID INT NOT NULL,
               FOREIGN KEY (workspaceID) REFERENCES Workspace(workspaceID)
               );""")

cur.execute("""CREATE TABLE ForecastEntry (
               EmployeeID INT NOT NULL,
               JobCode VARCHAR(20) NOT NULL,
               Cost DECIMAL,
               Days FLOAT NOT NULL,
               Month VARCHAR(10) NOT NULL,
               workspaceID INT NOT NULL,
               PRIMARY KEY (EmployeeID, JobCode),
               FOREIGN KEY (EmployeeID) REFERENCES Employee(EmployeeID),
               FOREIGN KEY (JobCode) REFERENCES Job(JobCode),
               FOREIGN KEY (workspaceID) REFERENCES Workspace(workspaceID)
               );""")
