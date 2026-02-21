import Foundation

let projectRoot = ProcessInfo.processInfo.environment["CSKIA_ROOT"]
    ?? "/Users/chendesheng/Sources/cskia"

let args = CommandLine.arguments.dropFirst()
let deno = "/opt/homebrew/bin/deno"
let cArgs = ([deno] + args).map { strdup($0) } + [nil]

chdir(projectRoot)
execv(deno, cArgs)
perror("execv failed")
exit(1)
