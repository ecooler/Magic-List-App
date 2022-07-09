package model;

/**
 *
 */
public class StoredFile {

    private final String fileId;
    private final String fileName;

    public StoredFile(String fileId, String fileName) {
        this.fileId = fileId;
        this.fileName = fileName;
    }

    public String getFileId() {
        return fileId;
    }

    public String getFileName() {
        return fileName;
    }
}
