VERSION 5.00
Begin VB.Form UseCsharp 
   Caption         =   "Form1"
   ClientHeight    =   4365
   ClientLeft      =   120
   ClientTop       =   465
   ClientWidth     =   6165
   LinkTopic       =   "Form1"
   ScaleHeight     =   4365
   ScaleWidth      =   6165
   StartUpPosition =   3  'Windows Default
   Begin VB.CommandButton btnDownload 
      Caption         =   "download"
      Height          =   615
      Left            =   5160
      TabIndex        =   24
      Top             =   360
      Width           =   975
   End
   Begin VB.CommandButton btnCommand 
      Caption         =   "Execte COmmand"
      Height          =   495
      Left            =   4800
      TabIndex        =   23
      Top             =   3840
      Width           =   1095
   End
   Begin VB.TextBox tbCommand 
      Height          =   375
      Left            =   1680
      TabIndex        =   21
      Text            =   "ShowMsg(""""Yey"")"
      Top             =   3840
      Width           =   2655
   End
   Begin VB.TextBox tbContent 
      Height          =   285
      Left            =   1680
      TabIndex        =   19
      Text            =   "D:\dev\dotnet\ComVisibleCSharpLibrary\ComVisibleCSharpLibrary\WebView2Content"
      Top             =   3360
      Width           =   3375
   End
   Begin VB.CommandButton btnHide 
      Caption         =   "Hide Window"
      Height          =   255
      Left            =   4920
      TabIndex        =   18
      Top             =   2520
      Width           =   1095
   End
   Begin VB.TextBox tbWorkDir 
      Height          =   375
      Left            =   1680
      TabIndex        =   17
      Text            =   "D:\temp\WebView2UserDataFolder"
      Top             =   3000
      Width           =   3255
   End
   Begin VB.CommandButton initWeb 
      Caption         =   "Init Web"
      Height          =   375
      Left            =   5040
      TabIndex        =   15
      Top             =   1560
      Width           =   855
   End
   Begin VB.ComboBox Combo1 
      Height          =   315
      ItemData        =   "UseCsharp.frx":0000
      Left            =   1440
      List            =   "UseCsharp.frx":0002
      TabIndex        =   14
      Top             =   2520
      Width           =   1215
   End
   Begin VB.CommandButton btnShowWin 
      Caption         =   "Show Window"
      Height          =   375
      Left            =   3360
      TabIndex        =   12
      Top             =   2520
      Width           =   1335
   End
   Begin VB.TextBox tbC 
      Height          =   285
      Left            =   3360
      TabIndex        =   7
      Top             =   1920
      Width           =   975
   End
   Begin VB.CommandButton tbC2F 
      Caption         =   "C2F"
      Height          =   315
      Left            =   1920
      TabIndex        =   6
      Top             =   2040
      Width           =   615
   End
   Begin VB.CommandButton btnFtoC 
      Caption         =   "F2C"
      Height          =   255
      Left            =   1920
      TabIndex        =   5
      Top             =   1560
      Width           =   615
   End
   Begin VB.TextBox tbF 
      Height          =   285
      Left            =   120
      TabIndex        =   4
      Top             =   1800
      Width           =   1215
   End
   Begin VB.TextBox tbIsStringMethodVis 
      Height          =   285
      Left            =   2400
      TabIndex        =   3
      Top             =   960
      Width           =   2535
   End
   Begin VB.CommandButton btnIsStringMethodVis 
      Caption         =   "Is String Method Vis"
      Height          =   255
      Left            =   120
      TabIndex        =   2
      Top             =   960
      Width           =   1935
   End
   Begin VB.CommandButton btnIsMethodVisible 
      Caption         =   "Is Int Method Visible"
      Height          =   255
      Left            =   120
      TabIndex        =   1
      Top             =   480
      Width           =   1575
   End
   Begin VB.TextBox tbIsIntMethodVisible 
      Height          =   285
      Left            =   1800
      TabIndex        =   0
      Top             =   480
      Width           =   2535
   End
   Begin VB.Label Command 
      Caption         =   "Label6"
      Height          =   375
      Left            =   360
      TabIndex        =   22
      Top             =   3960
      Width           =   975
   End
   Begin VB.Label Label5 
      Caption         =   "Content Dir"
      Height          =   255
      Left            =   360
      TabIndex        =   20
      Top             =   3480
      Width           =   975
   End
   Begin VB.Label Work 
      Caption         =   "Work Dir"
      Height          =   255
      Left            =   360
      TabIndex        =   16
      Top             =   3000
      Width           =   975
   End
   Begin VB.Label Label4 
      Caption         =   "Page"
      Height          =   375
      Left            =   600
      TabIndex        =   13
      Top             =   2520
      Width           =   615
   End
   Begin VB.Label lblVersion 
      Height          =   255
      Left            =   2040
      TabIndex        =   11
      Top             =   120
      Width           =   2175
   End
   Begin VB.Label Label3 
      Caption         =   "CsharpVersion"
      Height          =   255
      Left            =   360
      TabIndex        =   10
      Top             =   120
      Width           =   1335
   End
   Begin VB.Label Label2 
      Caption         =   "Celcius"
      Height          =   255
      Left            =   3480
      TabIndex        =   9
      Top             =   1560
      Width           =   975
   End
   Begin VB.Label Label1 
      Caption         =   "Fahrenheit"
      Height          =   255
      Left            =   240
      TabIndex        =   8
      Top             =   1440
      Width           =   1095
   End
End
Attribute VB_Name = "UseCsharp"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Private xCount As Integer
Private oPTouch As New PTouch
Private WithEvents m_eventSource As DemoEvents
Attribute m_eventSource.VB_VarHelpID = -1


Private Sub btnCommand_Click()
    oPTouch.ExecuteScript (tbCommand.Text)
End Sub

Private Sub btnDownload_Click()
    m_eventSource.DownloadFileAsync "https://datahub.io/core/airport-codes/r/airport-codes.json", "d:\temp\airport-codes.json"
    
End Sub

Private Sub m_eventSource_OnDownloadCompleted()
    MsgBox "Download Complete"
End Sub

Private Sub m_eventSource_OnDownloadFailed(ByVal message As String)
    MsgBox "Download failed. " & message, vbCritical, "Error"
End Sub

Private Sub btnFtoC_Click()
    Dim F As Single
    F = tbF.Text
    tbC.Text = oPTouch.GetCelsious(F)
End Sub

Private Sub btnHide_Click()


    status = oPTouch.HideForm()
End Sub

Private Sub btnIsMethodVisible_Click()
    xCount = xCount + oPTouch.IsThisIntMethodVisible
    tbIsIntMethodVisible.Text = "Count:" & xCount
End Sub

Private Sub btnIsStringMethodVis_Click()
    tbIsStringMethodVis.Text = oPTouch.IsThisStringMehtodVisible
End Sub


Private Sub btnShowWin_Click()
    Dim status As Integer
    Dim page As String
    
    page = Combo1.Text
    status = oPTouch.ShowForm(page)
    
End Sub


Private Function IsInIDE() As Boolean
    Dim mode
    mode = App.LogMode
        If mode = 0 Then
            IsInIDE = True
        ElseIf mode = 1 Then
             IsInIDE = False
        End If
End Function



Private Sub Form_Load()
    'Set m_eventSource = New COMVisibleEvents.DemoEvents
    lblVersion.Caption = oPTouch.GetVersion
    
    'Combo1.Items.Insert(0,"hello.html")
    Me.Combo1.AddItem ("hello.html")
    Me.Combo1.AddItem ("load3.html")
    Me.Combo1.ListIndex = 0
    
    
    
End Sub

Private Sub Form_Unload(Cancel As Integer)
    oPTouch.CloseForm
End Sub

Private Sub initWeb_Click()
    Dim status As Integer
    
    
    If IsInIDE Then
        'LoadLibrary App.Path & "\dist\ComVisibleCSharpLibrary.dll"
        oPTouch.SetWorkDir (tbWorkDir.Text)
        oPTouch.SetContentDir (tbContent.Text)
    End If
    
    ''oPTouch.SetContentDir (tbContent.Text)
    
     status = oPTouch.InitialiseWebView2()
End Sub

Private Sub tbC2F_Click()
    Dim C As String
    C = tbC.Text
    tbF.Text = oPTouch.GetFahrenheit(C)
End Sub



