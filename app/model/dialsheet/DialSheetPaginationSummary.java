package model.dialsheet;

/**
 *
 */
public class DialSheetPaginationSummary {

    private final String sheetId;
    private final long date;

    public DialSheetPaginationSummary(String sheetId, long date) {
        this.sheetId = sheetId;
        this.date = date;
    }

    public String getSheetId() {
        return sheetId;
    }

    public long getDate() {
        return date;
    }
}
