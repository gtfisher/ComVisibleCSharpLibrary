Imports System.Runtime.InteropServices
<Guid("042EFBF1-6B28-4C34-A5B7-75997A31E857")>
Public Interface IAllMethods
    Function IsThisMethodComVisible() As Boolean
    Function IsThisStringMethodVisible() As String
    Function IsThisIntMehtodVisible() As Integer

End Interface

<Guid("10048A53-C6DB-4863-8C80-62DF31C7E43C")>
<ClassInterface(ClassInterfaceType.None)>
Public Class PTouch
    Implements IAllMethods

    Public Function IsThisMethodComVisible() As Boolean Implements IAllMethods.IsThisMethodComVisible
        Return True
    End Function

    Public Function IsThisStringMethodVisible() As String Implements IAllMethods.IsThisStringMethodVisible
        Return "Yes It is Visible from VB.Net Library"
    End Function

    Public Function IsThisIntMehtodVisible() As Integer Implements IAllMethods.IsThisIntMehtodVisible
        Return 100
    End Function
End Class
