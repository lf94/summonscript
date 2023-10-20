define-command cad -docstring "Starts a CAD session" %{
  rename-client cad

  # Taken from make.rc.
  evaluate-commands nop %sh{
    ( pidof view3d || view3d & ) > /dev/null 2>&1 < /dev/null
  }

  hook window WinClose .* %{
    nop %sh{
      kill $(pidof view3d)
    }
  }

  hook buffer BufWritePost .* %{
    nop %sh{
      ( kill $(pidof node) || node "$kak_hook_param" & ) > /dev/null 2>&1 </dev/null
    }
  }
}
