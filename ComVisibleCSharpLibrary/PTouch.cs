using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;


namespace ComVisibleCSharpLibrary
{

    [ComVisible(true)]
    [Guid("C20D0C85-02C3-47E7-BAC8-5A4F61E8C346")]
    [InterfaceType(ComInterfaceType.InterfaceIsIDispatch)]
    public interface IDnEvents
    {
        [DispId(1)]
        void OnDownloadCompleted();

        [DispId(2)]
        void OnDownloadFailed(string message);
    }

    [ComVisible(true)]
    [Guid("EF345975-60D0-4BE1-AA9D-FD200D865633")]
    [InterfaceType(ComInterfaceType.InterfaceIsIDispatch)]
    public interface IDemoEvents2
    {
        [DispId(1)]
        Task DownloadFileAsync(string address, string filename);
    }



    [Guid("B25E0195-B9F9-42F8-B554-83424A2B24D5")]
    public interface AllMethods

       
    {

        [DispId(1)]
        Task DownloadFileAsync(string address, string filename);

        int IsThisIntMethodVisible();
        bool IsThisMethodComVisible();
        string IsThisStringMehtodVisible();

        Single GetCelsious(Single f);
        Single GetFahrenheit(Single c);

        String GetVersion();

        int InitialiseWebView2();

        int ShowForm(string page);

        int HideForm();

        int CloseForm();

        void ExecuteScript(string cmd);

        void SetWorkDir(string workDIr);

        void SetContentDir(string contentDir);


    }


    [ComVisible(true)]
    [ClassInterface(ClassInterfaceType.None)]
    [Guid("16A08691-A17F-4BAE-9D3B-FA5B50F51960")]
    [ProgId("ComVisibleCSharpLibrary.PTouch")]
    public class PTouch : AllMethods, IDemoEvents2
    {
        public delegate void OnDownloadCompletedDelegate();
        public delegate void OnDownloadFailedDelegate(string message);

        public event OnDownloadCompletedDelegate OnDownloadCompleted;
        public event OnDownloadFailedDelegate OnDownloadFailed;

        private string FileNamePath(string filename)
            => Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), filename);

        private MyWebView _form1 = null;
        public PTouch()
        {

        }

        public async Task DownloadFileAsync(string address, string filename)
        {
            try
            {
                using (var webClient = new WebClient())
                {
                    await webClient
                        .DownloadFileTaskAsync(new Uri(address), FileNamePath(filename))
                        .ContinueWith(t =>
                        {
                            if (t.Status == TaskStatus.Faulted)
                            {
                                var failed = OnDownloadFailed;
                                failed?.Invoke(GetExceptions(t));
                            }
                            else
                            {
                                var completed = OnDownloadCompleted;
                                completed?.Invoke();
                            }
                        }, TaskScheduler.FromCurrentSynchronizationContext());
                }
            }
            catch (Exception ex)
            {
                Debug.WriteLine(ex.ToString());
            }

            #region Local

            string GetExceptions(Task task)
            {
                var innerExceptions = task.Exception?.Flatten().InnerExceptions;
                if (innerExceptions == null)
                    return string.Empty;
                var builder = new StringBuilder();
                foreach (var e in innerExceptions)
                    builder.AppendLine(e.Message);
                return builder.ToString();
            }

            #endregion Local
        }

        public string GetVersion()
    {
        return "1.0.0.2";
    }

        public void ExecuteScript(string cmd)
        {
            SimpleLog.LogText($"ExecuteScript: {cmd}  ");
            //MessageBox.Show($"ExecuteScript: {cmd}");
            _form1.ExecuteScriptAsync(cmd);
        }

        public int CloseForm()
        {
            SimpleLog.LogText($"Info: CloseForm");

            try
            {
                SimpleLog.LogText($"Info _form null:{_form1 == null}"); 
                if ( _form1 != null )
                {
                    _form1.Close();
                    SimpleLog.LogText($"Info: CloseD");
                    _form1.Dispose();
                    SimpleLog.LogText($"Info: CloseD");
                }
               

                return 0;
            }
            catch (Exception ex)
            {
                SimpleLog.LogText(ex.ToString());
                return 0;
            }

          
            
        }

        public int InitialiseWebView2()
        {
            SimpleLog.LogText($"InitialiseWebView2");

            var form1 = new MyWebView();
            _form1 = form1;

            SimpleLog.LogText("optimoor web form created");

            return 0;
        }

        public int ShowForm(string page)
        {
            
            SimpleLog.LogText($"Info: Show Form for page:{page}");

            SimpleLog.LogText($"Info: Show Form for page:{page}");

            //if (_form1 == null)
            //{
            //}

            SimpleLog.LogText($"Info: Set page");
            _form1.SetPage(page);
            SimpleLog.LogText($"Info: Show Page");
            _form1.Show();


            return 0;
        }

        public int HideForm()
        {

            //_optForm.Page = page;
            //Log($"optimoor web set page {page}");

            SimpleLog.LogText($"optimoor web Show");
            _form1.Hide();

            return 0;
        }



        public Single GetFahrenheit(Single c)
        {

            SimpleLog.LogText($"Info: GetFahrenheit for c:{c}");
            Single fr = (c * 9) / 5 + 32;
            SimpleLog.LogText($"Info: f is:{fr}");
            return fr;
        }

        public Single GetCelsious(Single f)
        {
            SimpleLog.LogText($"Info: GetCelsious for f:{f}");
            Single cel = (f - 32) * 5 / 9;
            SimpleLog.LogText($"Info: c is: {cel}");
            return cel;
        }

        public bool IsThisMethodComVisible()
        {
            return true;
        }

        public string IsThisStringMehtodVisible()
        {
            return "Yes Visible";
        }

        public int IsThisIntMethodVisible()
        {
            return 1;
        }

        public void SetWorkDir(string workDir)
        {
            SimpleLog.LogText($"Info: SetWorkDir for:{workDir}");
            MyWebView._workPath = workDir;
            SimpleLog.LogText($"Info: WorkDir for:{MyWebView._workPath}");

        }

        public void SetContentDir(string contentDir)
        {
            SimpleLog.LogText($"Info: SetWorkDir for:{contentDir}");
            MyWebView._content = contentDir;
            SimpleLog.LogText($"Info: WorkDir for:{MyWebView._content}");

        }



    }
}
