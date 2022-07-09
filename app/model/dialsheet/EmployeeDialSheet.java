package model.dialsheet;

import model.manager.Employee;

public class EmployeeDialSheet extends DialSheet {

    private final Employee employee;

    public EmployeeDialSheet(DialSheet dialSheet, Employee employee) {
        super(dialSheet.id, dialSheet.dialCount, dialSheet.date, dialSheet.contactsCount, dialSheet.appointmentsCount);
        this.employee = employee;
    }

    public Employee getEmployee() {
        return employee;
    }
}
