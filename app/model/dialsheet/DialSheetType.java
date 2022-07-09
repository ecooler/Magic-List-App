package model.dialsheet;

/**
 * Created by Corey Caplan on 10/14/17.
 */
public enum DialSheetType {

    DAY, WEEK, MONTH, QUARTER, YEAR, CENTURY;

    public String getValue() {
        return this.toString().toLowerCase();
    }

}
