package model.graph;

/**
 * Created by Corey on 6/22/2017.
 * Project: magic_list_maker-server
 * <p></p>
 * Purpose of Class:
 */
enum GraphType {

    LINE, BAR, DOUGHNUT;


    @Override
    public String toString() {
        if (this == LINE) {
            return "line";
        } else if (this == BAR) {
            return "bar";
        } else if (this == DOUGHNUT) {
            return "doughnut";
        } else {
            throw new IllegalArgumentException("Invalid graph type!");
        }
    }
}
