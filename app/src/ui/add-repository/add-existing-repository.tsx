import { remote } from 'electron'
import * as React from 'react'

import { Dispatcher } from '../../lib/dispatcher'
import { LocalGitOperations } from '../../lib/local-git-operations'
import Repository from '../../models/repository'

const untildify: (str: string) => string = require('untildify')

interface IAddExistingRepositoryProps {
  readonly dispatcher: Dispatcher
}

interface IAddExistingRepositoryState {
  readonly path: string
  readonly isGitRepository: boolean | null
}

export default class AddExistingRepository extends React.Component<IAddExistingRepositoryProps, IAddExistingRepositoryState> {
  private checkGitRepositoryToken = 0

  public constructor(props: IAddExistingRepositoryProps) {
    super(props)

    this.state = { path: '', isGitRepository: false }
  }

  public render() {
    const disabled = this.state.path.length === 0 || this.state.isGitRepository == null
    return (
      <div id='add-existing-repository' className='panel'>
        <div className='file-picker'>
          <label>Local Path
            <input value={this.state.path}
                   placeholder='repository path'
                   onChange={event => this.onPathChanged(event)}/>
          </label>

          <button onClick={() => this.showFilePicker()}>Choose…</button>
        </div>

        <hr/>

        <button disabled={disabled} onClick={() => this.addRepository()}>
          {this.state.isGitRepository ? 'Add Repository' : 'Create & Add Repository'}
        </button>
      </div>
    )
  }

  private onPathChanged(event: React.FormEvent<HTMLInputElement>) {
    const path = event.target.value
    this.checkIfPathIsRepository(path)
  }

  private showFilePicker() {
    const directory: string[] | null = remote.dialog.showOpenDialog({ properties: [ 'createDirectory', 'openDirectory' ] })
    if (!directory) { return }

    const path = directory[0]
    this.checkIfPathIsRepository(path)
  }

  private async checkIfPathIsRepository(path: string) {
    this.setState({ path, isGitRepository: null })

    const token = ++this.checkGitRepositoryToken

    const resolvedPath = untildify(path)
    const isGitRepository = await LocalGitOperations.isGitRepository(resolvedPath)

    // Another path check was requested so don't update state based on the old
    // path.
    if (token !== this.checkGitRepositoryToken) { return }

    this.setState({ path: this.state.path, isGitRepository })
  }

  private async addRepository() {
    const resolvedPath = untildify(this.state.path)
    if (!this.state.isGitRepository) {
      await LocalGitOperations.initGitRepository(resolvedPath)
    }

    const repository = new Repository(resolvedPath)
    this.props.dispatcher.addRepositories([ repository ])
    this.props.dispatcher.closePopup()
  }
}
