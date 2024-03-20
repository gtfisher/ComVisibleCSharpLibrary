Side-by-side Manifest


Comm visible csharp lib forked from [ComVisibleCSharpLibrary](https://github.com/riyasalmoe/ComVisibleCSharpLibrary)


This builds a dll that can be called by VB6.

Added a noddy VB6 example that call's in to the csharp


VB6 has a reference to the TLB

Current TLB build with 

Regasm ComVisibleCSharpLibrary.dll /TLB /CODEBASE in folder D:\dev\dotnet\ComVisibleCSharpLibrary\ComVisibleCSharpLibrary\bin\Debug


Then used Side-by-side manifest maker  to  generate the manifest files, this is the paid for version, this could possible be done with free tools. e.g [https://github.com/wqweto/UMMM](https://github.com/wqweto/UMMM)

All ouptut copied to dist (manual copy ATT) 

Dist folder can then be run on sandbox machine without registration

TODO:

Could be done by hand by using my.exe (I think)

Also could be setup so all files  get put to correct place

Perhaps a batch script


Show C# Window

The Show Window button opens a C# window. This is currently a WEbView2 form that can be provided with an HTML name. Thehtml page will be opened, the WebView2 is set to use WebView2Content 


