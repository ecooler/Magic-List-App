package utilities;

import java.text.NumberFormat;

public class PriceUtility {

    public static String getPriceFromStripe(long price) {
        return NumberFormat.getCurrencyInstance()
                .format(price / 100.0);
    }

}
