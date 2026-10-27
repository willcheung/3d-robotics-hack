import com.sun.jdi.*;
import com.sun.jdi.connect.*;
import com.sun.jdi.event.*;
import com.sun.jdi.request.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;

/** Practice-only debugger. Both JVMs stay inside the disposable sandbox. The
 * learner's source and bytecode are unchanged; JDI reports real line visits. */
public final class TraceMain {
    private static final Object outputLock = new Object();
    private static final BlockingQueue<Boolean> traceReplies = new ArrayBlockingQueue<>(1);
    private static int sequence = 2000;
    private static void output(String line) {
        synchronized (outputLock) { System.out.println(line); System.out.flush(); }
    }
    private static Thread pump(InputStream from, PrintStream to) {
        Thread thread = new Thread(() -> {
            try (BufferedReader lines = new BufferedReader(new InputStreamReader(from, StandardCharsets.UTF_8))) {
                String line;
                while ((line = lines.readLine()) != null) {
                    if (to == System.out) output(line); else to.println(line);
                }
            } catch (IOException ignored) { }
        });
        thread.setDaemon(true); thread.start(); return thread;
    }
    private static void trace(int line) throws InterruptedException {
        if (line < 1) return;
        if (++sequence > 12000) throw new IllegalStateException("Line trace limit reached (10,000 visits). Try fewer repeats.");
        output("@robot {\"type\":\"trace\",\"id\":" + sequence + ",\"line\":" + line + "}");
        traceReplies.take();
    }
    public static void main(String[] args) throws Exception {
        LaunchingConnector connector = Bootstrap.virtualMachineManager().defaultConnector();
        var arguments = connector.defaultArguments();
        arguments.get("main").setValue("Main");
        arguments.get("options").setValue("-Xmx64m -XX:MaxMetaspaceSize=48m -XX:MaxDirectMemorySize=16m -XX:ActiveProcessorCount=1 -XX:+UseSerialGC -XX:-UsePerfData -cp out:/opt/robot");
        // The connector opens only an ephemeral loopback connection in the
        // sandbox's private network namespace. Nothing is published to the host.
        VirtualMachine vm = connector.launch(arguments);
        Process child = vm.process();
        Thread stdout = pump(child.getInputStream(), System.out), stderr = pump(child.getErrorStream(), System.err);
        Thread replies = new Thread(() -> {
            try {
                BufferedReader input = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
                var target = new PrintWriter(child.getOutputStream(), true, StandardCharsets.UTF_8);
                String line;
                while ((line = input.readLine()) != null) {
                    if (line.equals("TRACE")) { if (!traceReplies.offer(true)) throw new IOException("Overlapping trace reply"); }
                    else { target.println(line); }
                }
            } catch (IOException ignored) { }
            child.destroyForcibly();
        });
        replies.setDaemon(true); replies.start();
        try {
            var prepare = vm.eventRequestManager().createClassPrepareRequest();
            prepare.setSuspendPolicy(EventRequest.SUSPEND_ALL); prepare.enable();
            boolean connected = true;
            while (connected) {
                EventSet events = vm.eventQueue().remove();
                for (Event event : events) {
                    if (event instanceof ClassPrepareEvent loaded) {
                        ReferenceType type = loaded.referenceType();
                        try {
                            if (type.sourceName().equals("Main.java")) {
                                // Each bytecode location for a source line is
                                // needed: a loop header may have several entries.
                                var exits = vm.eventRequestManager().createMethodExitRequest();
                                exits.addClassFilter(type); exits.setSuspendPolicy(EventRequest.SUSPEND_ALL); exits.enable();
                                for (Location location : type.allLineLocations()) {
                                    var breakpoint = vm.eventRequestManager().createBreakpointRequest(location);
                                    breakpoint.setSuspendPolicy(EventRequest.SUSPEND_ALL); breakpoint.enable();
                                }
                            }
                        } catch (AbsentInformationException ignored) { }
                    } else if (event instanceof BreakpointEvent point) {
                        trace(point.location().lineNumber());
                    } else if (event instanceof MethodExitEvent exit) {
                        // Returning an argument/helper can continue the caller's
                        // existing line without hitting another line breakpoint.
                        for (int index = 1; index < exit.thread().frameCount(); index++) {
                            Location caller = exit.thread().frame(index).location();
                            try {
                                if (caller.sourceName().equals("Main.java")) { trace(caller.lineNumber()); break; }
                            } catch (AbsentInformationException ignored) { }
                        }
                    } else if (event instanceof VMDisconnectEvent || event instanceof VMDeathEvent) connected = false;
                }
                if (connected) events.resume();
            }
        } catch (VMDisconnectedException ignored) {
        } catch (Throwable failure) {
            child.destroyForcibly();
            throw failure;
        } finally {
            // Drain actual program output before returning its exit status.
            int result = child.waitFor();
            stdout.join(1000); stderr.join(1000);
            if (result != 0) System.exit(result);
        }
    }
}
