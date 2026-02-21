import Foundation

let projectRoot: String = {
    var url = URL(fileURLWithPath: #filePath)
    for _ in 0..<5 { url.deleteLastPathComponent() }
    return url.path
}()

let args = CommandLine.arguments.dropFirst()
let cArgs = (["deno"] + args).map { strdup($0) } + [nil]

var path = ProcessInfo.processInfo.environment["PATH"] ?? "/usr/bin:/bin"
path = "/opt/homebrew/bin:/usr/local/bin:" + path
setenv("PATH", path, 1)

chdir(projectRoot)
execvp("deno", cArgs)
perror("execvp failed")
exit(1)
