declare-option str cadcmd 'node'
declare-option str toolsclient
define-command cad -docstring "Starts a CAD session" %{

  # Taken from kak examples
  rename-client main
  set global jumpclient main

  new rename-client tools
  set global toolsclient tools

  # Taken from make.rc.
  nop %sh{
    kill $(pidof view3d) > /dev/null 2>&1 < /dev/null
    ( view3d & ) > /dev/null 2>&1 < /dev/null
  }

  remove-hooks window cad
  hook -group cad window WinClose .* %{
    nop %sh{
      kill $(pidof view3d) > /dev/null 2>&1 < /dev/null
    }
  }

  remove-hooks buffer cad
  hook -group cad buffer BufWritePost .* %{
    evaluate-commands %sh{
      # Taken from grep.rc
      output=$(mktemp -d "${TMPDIR:-/tmp}"/kak-cad.XXXXXXXX)/fifo
      mkfifo ${output}
      ( ${kak_opt_cadcmd} "$kak_hook_param" > ${output} 2>&1 & ) > /dev/null 2>&1 < /dev/null

      printf %s\\n "evaluate-commands -try-client '$kak_opt_toolsclient' %{
          edit! -fifo ${output} *cad*
          set-option buffer filetype cad
          hook -always -once buffer BufCloseFifo .* %{ nop %sh{ rm -r $(dirname ${output}) } }
      }"
    }
  }
}
