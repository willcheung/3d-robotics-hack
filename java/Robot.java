import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/** Ordered commands only. The simulator, sensors and result live outside Java. */
public final class Robot {
    private static final BufferedReader replies = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
    private static int sequence = 0;
    private Robot() {}
    private static synchronized double call(String op, Double value) throws Exception {
        String argument = value == null ? "" : ",\"value\":" + value;
        System.out.println("@robot {\"type\":\"command\",\"id\":" + (++sequence) + ",\"command\":{\"op\":\"" + op + "\"" + argument + "}}");
        System.out.flush();
        String reply = replies.readLine();
        if (reply == null) throw new IllegalStateException("Robot connection closed. Run again.");
        if (reply.startsWith("ERROR ")) throw new IllegalArgumentException(reply.substring(6));
        return reply.equals("null") ? 0 : Double.parseDouble(reply);
    }
    public static void motor(double power) throws Exception { call("motor", power); }
    public static void servo(double degrees) throws Exception { call("servo", degrees); }
    public static void waitTicks(int ticks) throws Exception { call("wait", (double) ticks); }
    public static double angle() throws Exception { return call("angle", null); }
    public static double scanner() throws Exception { return call("scanner", null); }
    public static void shoulder(double degrees) throws Exception { call("shoulder", degrees); }
    public static void elbow(double degrees) throws Exception { call("elbow", degrees); }
    public static void grip(double mm) throws Exception { call("grip", mm); }
    public static double shoulderAngle() throws Exception { return call("shoulderAngle", null); }
    public static double elbowAngle() throws Exception { return call("elbowAngle", null); }
    public static double aperture() throws Exception { return call("aperture", null); }
    public static double holding() throws Exception { return call("holding", null); }
    public static double clock() throws Exception { return call("clock", null); }
}
