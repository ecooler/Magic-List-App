package model.account;

public class AccountMetaData {

    private final String stripeCouponId;
    private final String verifyEmailToken;
    private final String subscriptionStatus;

    public AccountMetaData(String stripeCouponId, String verifyEmailToken, String subscriptionStatus) {
        this.stripeCouponId = stripeCouponId;
        this.verifyEmailToken = verifyEmailToken;
        this.subscriptionStatus = subscriptionStatus;
    }

    public String getStripeCouponId() {
        return stripeCouponId;
    }

    public String getVerifyEmailToken() {
        return verifyEmailToken;
    }

    public String getSubscriptionStatus() {
        return subscriptionStatus;
    }
}
