using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement.ProgressBar;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;
using Microsoft.Web.WebView2.WinForms;
using Microsoft.Web.WebView2.Core;
using System.IO;
using System.Diagnostics;
using static System.Net.Mime.MediaTypeNames;
using System.Reflection;

namespace ComVisibleCSharpLibrary
{
    public partial class MyWebView : Form
    {

        const bool DEBUG = true;

        public static string _workPath = $"./work";

        private string _page;
        //create new instance of WebView2
        Microsoft.Web.WebView2.WinForms.WebView2 webView21 = new Microsoft.Web.WebView2.WinForms.WebView2();

        //string docPath = Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments);
        string docPath = System.AppDomain.CurrentDomain.BaseDirectory;

       

        public void SetPage(string page)
        {
            SimpleLog.LogText($"info: Set Page:{page} ");
            _page = page;
            //webView21.Source = new Uri($"http://localfiles/{_page}", UriKind.Absolute);
        }

        public string GetPage(string page)
        {
            SimpleLog.LogText($"info: Get Page:{page} ");
            return _page;
            //webView21.Source = new Uri($"http://localfiles/{_page}", UriKind.Absolute);
        }

        public MyWebView(string page)
        {

            SimpleLog.LogText("Info: Created form");
            InitializeComponent();


            _page = page;
            SimpleLog.LogText($"Info: Set page {_page}");


            webView21.Location = new System.Drawing.Point(10, 10);
            webView21.Size = new System.Drawing.Size(800, 600);
            webView21.Dock = DockStyle.Fill;
            //don't set Source property here

            SimpleLog.LogText("Info: Added webView21");
           

            this.Controls.Add(webView21);

            SimpleLog.LogText("Info: EnsureCoreWebView2Async");

            //initialize CoreWebView2
            //await InitializeAsync();
            InitializeAsync();

            SimpleLog.LogText("Info: after initializing CoreWebView2");

            //webView21.EnsureCoreWebView2Async(null);


            //MessageBox.Show("Info: Navigate");
            //if (webView21 != null && webView21.CoreWebView2 != null)
            //{
            //navigate to website - option 1
            //    webView21.Source = new Uri("https://www.microsoft.com", UriKind.Absolute);

            //navigate to website - option 2
            //webView21.CoreWebView2.Navigate("https://www.microsoft.com");
            //}//i

            //InitializeWebView();


        }


        private async Task InitializeAsync()
        {
            SimpleLog.LogText("--------------------------------------------------");
            SimpleLog.LogText("Info: InitializeAsync");

            //var tempPath = Path.GetTempPath();
           

            bool exists = System.IO.Directory.Exists(_workPath);

            if (!exists)
                System.IO.Directory.CreateDirectory(_workPath);


            SimpleLog.LogText($"Info: tempPath {_workPath}");


            String UserDataFolder;
            UserDataFolder = _workPath;



            //var env = await CoreWebView2Environment.CreateAsync(userDataFolder: Path.Combine(tempPath, "Content_Browser"));
            var env = await CoreWebView2Environment.CreateAsync(userDataFolder: UserDataFolder);



            SimpleLog.LogText("Info: Created env");
            SimpleLog.LogText($"Info: env.UserDataFolder {env.UserDataFolder}");


           



            // wait for coreWebView2 initialization
            await webView21.EnsureCoreWebView2Async(env);

            SimpleLog.LogText("Info: After EnsureCoreWebView2Async");


            //if (openDevTools)
            //     webView21.CoreWebView2.OpenDevToolsWindow

            SetVirtualHostNameToFolderMapping();

            webView21.CoreWebView2InitializationCompleted += WebView21_CoreWebView2InitializationCompleted;
            webView21.NavigationCompleted += WebView21_NavigationCompleted;

            if (DEBUG)
            {
                //webView21.CoreWebView2.GetDevToolsProtocolEventReceiver("Log.entryAdded").DevToolsProtocolEventReceived += ConsoleMessage;
                //await webView21.CoreWebView2.CallDevToolsProtocolMethodAsync("Log.enable", "{}");
                webView21.CoreWebView2.OpenDevToolsWindow();
            }


            //webView21.Source = new Uri("https://google.co.uk");

            NavigateToPage(_page);



            SimpleLog.LogText("Info: after EnsureCoreWebView2Async");
        }

        private void WebView21_NavigationCompleted(object sender, CoreWebView2NavigationCompletedEventArgs e)
        {
            SimpleLog.LogText("Info: after WebView21_NavigationCompleted");
        }

        private void WebView21_CoreWebView2InitializationCompleted(object sender, CoreWebView2InitializationCompletedEventArgs e)
        {
            SimpleLog.LogText("Info: WebView21_CoreWebView2InitializationCompleted");

            
        }



        public void NavigateToPage(string page)
        {
            SimpleLog.LogText("Navigating...");

            this.Text = page;
            _page = page;


            var pageUrl = $"http://localfiles/{_page}";

            SimpleLog.LogText($"Info: Set source: {pageUrl}");


            webView21.Source = new Uri(pageUrl, UriKind.Absolute);
        }

        private void webView21_CoreWebView2Ready(object sender, EventArgs e)
        {
            MessageBox.Show("Info: webView21_CoreWebView2Ready");

            //subscribe to events (add event handlers) - CoreWebView2
            //webView21.CoreWebView2.NavigationCompleted += CoreWebView2_NavigationCompleted;

            //subscribe to events (add event handlers) - WebView2
            //webView21.NavigationStarting += webView21_NavigationStarting;
            //webView21.NavigationCompleted += webView21_NavigationCompleted;

            MessageBox.Show("Info: leaving webView21_CoreWebView2Ready");
        }


        //NOTE: apparently not initialised until after function exits
        private void webView21_CoreWebView2InitializationCompleted(object sender, CoreWebView2InitializationCompletedEventArgs e)
        {
            SimpleLog.LogText("nitializationComplete.");
           // DisplayStatus("Control initialised...");

            //#TODO very slow!
            //await this.webView21.CoreWebView2.Profile.ClearBrowsingDataAsync();
            //Log("Cache cleared");

            //string localFolder = Application.StartupPath;

            UriBuilder uri = new UriBuilder(Assembly.GetExecutingAssembly().Location);
            string path = Uri.UnescapeDataString(uri.Path);
            string localFolder = Path.GetDirectoryName(path);

            string srcurl;

//#if DEBUG
            /*if (DEBUG)
            {
                //local for dev
            //    srcurl = @"file:///" + localFolder + "/../../../../WebView2/html/Optimoor3dWidget.html";
            }
            else
            {
                //debug release
                srcurl = @"file:///" + localFolder + "/html/Optimoor3dWidget.html";
            }
#else
            srcurl = @"file:///" + localFolder + "/ea433b7/Optimoor3dWidget.html";
#endif
            */
            //string srcurl = @"http://localhost/tti/Optimoor.Net/WebView2/html/Optimoor3dWidget.html?AUTOSTART=1";
            //string srcurl = @"https://www.bbc.co.uk";
            //string srcurl = @"file:///" + localFolder + "/html/test.html";

            ////webView21.Source = new Uri(srcurl);

            //#TODO IsInitialised rejects working webView21
            //if (!IsInitialised)
            //{
            //    Log("WebView2 not ready");
            //}
            //else
            //{
            SimpleLog.LogText("Navigating...");

            if (_page.Length < 2) _page = "hello.html";


            var pageUrl = $"http://localfiles/{_page}";

            SimpleLog.LogText($"Info: Set source: {pageUrl}");


            webView21.Source = new Uri(pageUrl, UriKind.Absolute);
            //webView21.CoreWebView2.Navigate(srcurl);
            //}


            //get file. Max: 2 * 1024 * 1024 bytes
            //webView21.CoreWebView2.NavigateToString(System.IO.File.ReadAllText("index.html"));
            //unable to access external sources (Summer 2023).
            //#TODO review state of development

        }




        private async void SetVirtualHostNameToFolderMapping()
        {
            SimpleLog.LogText("Info: SetVirtualHostNameToFolderMapping");

            //string resourcePath = @"D:\dev\WebView2-Resource";
            string resourcePath = @".\WebView2Content";

            string webViewContentEnv = Environment.GetEnvironmentVariable("WebView2Content");
            if (webViewContentEnv != null)
            {
                resourcePath = webViewContentEnv;
            }

            SimpleLog.LogText($"Info: resourcePath: {resourcePath}");

            //string resourcePath = @".\StaticWebView";

            webView21.CoreWebView2.SetVirtualHostNameToFolderMapping("localfiles", resourcePath, CoreWebView2HostResourceAccessKind.Allow);
        }

    }
}
